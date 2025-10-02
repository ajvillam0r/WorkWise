<?php

namespace App\Services;

use App\Models\GigJob;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class MatchService
{
    private ?string $apiKey;
    private string $model;
    private string $baseUrl;
    private string $certPath;
    private bool $isConfigured;

    public function __construct()
    {
        // Prioritize META_LLAMA_L4_SCOUT_FREE API key from .env file
        $this->apiKey = env('META_LLAMA_L4_SCOUT_FREE') ?: config('services.openrouter.api_key');
        $this->model = 'meta-llama/llama-4-scout:free';
        $this->baseUrl = config('services.openrouter.base_url') ?: env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
        $this->certPath = base_path('cacert.pem');
        $this->isConfigured = !empty($this->apiKey);

        if (!$this->isConfigured) {
            Log::warning('META_LLAMA_L4_SCOUT_FREE API key is not configured. AI matching will use fallback mode.');
        } else {
            Log::info('AI matching configured with META_LLAMA_L4_SCOUT_FREE API key');
        }
    }

    /**
     * Get match score between a job and a gig worker using keyword matching as fallback
     */
    private function getFallbackMatch(GigJob $job, User $gigWorker): array
    {
        $score = 0;
        $reasons = [];

        // Quick validation - return early if no skills data
        if (empty($gigWorker->skills) || empty($job->required_skills)) {
            return [
                'score' => 10, // Minimal score for having a profile
                'reason' => 'Basic profile match - consider for general opportunities',
                'success' => true
            ];
        }

        // Compare required skills with optimized matching
        $gigWorkerSkills = array_map('strtolower', $gigWorker->skills);
        $jobSkills = array_map('strtolower', $job->required_skills);

        // Direct matches (most important)
        $matchingSkills = array_intersect($gigWorkerSkills, $jobSkills);
        
        // Quick partial matching (limit to prevent timeout)
        $partialMatches = [];
        $maxPartialChecks = min(5, count($jobSkills)); // Limit partial match checks
        
        foreach (array_slice($jobSkills, 0, $maxPartialChecks) as $jobSkill) {
            if (!in_array($jobSkill, $matchingSkills)) {
                foreach ($gigWorkerSkills as $gigWorkerSkill) {
                    if (strlen($jobSkill) > 3 && strlen($gigWorkerSkill) > 3) {
                        if (str_contains($gigWorkerSkill, $jobSkill) || str_contains($jobSkill, $gigWorkerSkill)) {
                            $partialMatches[] = $jobSkill;
                            break;
                        }
                    }
                }
            }
        }

        $directMatchScore = count($matchingSkills) > 0
            ? min(100, (count($matchingSkills) / count($jobSkills)) * 100)
            : 0;

        $partialMatchScore = count($partialMatches) > 0
            ? min(50, (count($partialMatches) / count($jobSkills)) * 50) // Partial matches worth 50% of direct, max 50
            : 0;

        $skillScore = min(100, $directMatchScore + $partialMatchScore);
        $score += $skillScore * 0.6; // Skills are 60% of the score

        // Compare experience level with more generous scoring
        $experienceLevels = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        $jobLevel = $experienceLevels[$job->experience_level] ?? 2; // Default to intermediate
        $gigWorkerLevel = $experienceLevels[$gigWorker->experience_level] ?? 2; // Default to intermediate

        $levelDiff = abs($jobLevel - $gigWorkerLevel);
        $experienceScore = match($levelDiff) {
            0 => 100, // Perfect match
            1 => 75,  // One level off
            default => 50 // Two or more levels off
        };
        $score += $experienceScore * 0.4; // Experience is 40% of the score

        // Build reason text with more positive language
        if (count($matchingSkills) > 0) {
            $reasons[] = "Strong match on " . count($matchingSkills) . " key skills: " . implode(', ', $matchingSkills);
        }
        if (count($partialMatches) > 0) {
            $reasons[] = "Partial match on " . count($partialMatches) . " related skills: " . implode(', ', $partialMatches);
        }
        if ($levelDiff === 0) {
            $reasons[] = "Perfect experience level alignment";
        } elseif ($levelDiff === 1) {
            $reasons[] = "Good experience level fit";
        } else {
            $reasons[] = "Experience level considered";
        }

        // Add bonus for having skills even if not perfect match
        if (count($gigWorkerSkills) > 0 && $score < 30) {
            $score += 20; // Bonus for having any relevant skills
            $reasons[] = "Shows relevant technical background";
        }

        return [
            'score' => min(100, round($score)), // Cap at 100
            'reason' => count($reasons) > 0
                ? implode('. ', $reasons)
                : 'Profile shows potential for this role',
            'success' => true
        ];
    }

    /**
     * Get match score between a job and a gig worker
     */
    public function getJobMatch(GigJob $job, User $gigWorker): array
    {
        // If OpenRouter is not configured, use fallback matching
        if (!$this->isConfigured) {
            return $this->getFallbackMatch($job, $gigWorker);
        }

        // Generate cache key
        $cacheKey = "match_score_{$job->id}_{$gigWorker->id}";

        // Check cache first
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            // Prepare job description
            $jobText = "Job Title: {$job->title}\n" .
                      "Description: {$job->description}\n" .
                      "Required Skills: " . implode(', ', $job->required_skills) . "\n" .
                      "Experience Level: {$job->experience_level}\n" .
                      "Budget: ₱{$job->budget_min} - ₱{$job->budget_max} ({$job->budget_type})";

            // Prepare gig worker profile
            $gigWorkerSkills = $gigWorker->skills ?? [];
            $experienceLevel = $gigWorker->experience_level ?? 'Not specified';
            $hourlyRate = $gigWorker->hourly_rate ?? 'Not set';
            $professionalTitle = $gigWorker->professional_title ?? 'Not specified';

            $gigWorkerText = "Your Profile:\n" .
                            "Professional Title: {$professionalTitle}\n" .
                            "Skills: " . (empty($gigWorkerSkills) ? 'No skills listed' : implode(', ', $gigWorkerSkills)) . "\n" .
                            "Experience Level: {$experienceLevel}\n" .
                            "Hourly Rate: ₱{$hourlyRate}\n" .
                            "Bio: " . substr($gigWorker->bio ?? 'No bio provided', 0, 150);

            // Make API call to OpenRouter
            $response = Http::withToken($this->apiKey)
                ->withOptions([
                    'verify' => $this->certPath
                ])
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'WorkWise Job Matching'
                ])
                ->post($this->baseUrl . '/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an expert AI career advisor for Philippine freelance job matching. You MUST analyze ONLY skills and experience compatibility. SCORING GUIDELINES: Give 80-100 for excellent skill matches (4+ direct skills), 60-79 for good matches (2-3 direct skills), 40-59 for fair matches (1-2 direct skills or many related skills), 20-39 for weak matches (only related/transferable skills), 0-19 for poor matches (minimal relevance). IMPORTANT: Be encouraging yet realistic. Focus on: 1) Count exact skill matches, 2) Identify related/complementary skills, 3) Match experience levels (beginner/intermediate/expert), 4) Note skill gaps with learning potential. Address gig worker as "you/your". Use ₱ for currency. Format: "Score: X\nReason: [Detailed 2-3 sentence explanation with specific skill matches, experience alignment, and growth potential]"'
                        ],
                        [
                            'role' => 'user',
                            'content' => "Match Analysis - Focus ONLY on skills & experience:\n\n📋 JOB REQUIREMENTS:\n{$jobText}\n\n👤 YOUR PROFILE:\n{$gigWorkerText}\n\nAnalyze:\n1. EXACT skill matches (list them)\n2. Related/complementary skills you have\n3. Experience level match (beginner/intermediate/expert)\n4. Skill gaps and learning curve\n5. Overall compatibility score (0-100)\n\nBe specific about which skills match and why. Ignore budget, location, ratings."
                        ]
                    ],
                    'temperature' => 0.4,
                    'max_tokens' => 250
                ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'];
                
                // Parse the response with improved regex
                preg_match('/Score:\s*(\d+)/i', $content, $scoreMatch);
                preg_match('/Reason:\s*(.+?)(?=\n\n|\n*$)/ims', $content, $reasonMatch);

                // Log the AI response for debugging
                Log::debug('AI Response', [
                    'content' => $content,
                    'score_match' => $scoreMatch,
                    'reason_match' => $reasonMatch
                ]);

                // If AI parsing fails, use fallback scoring
                if (empty($scoreMatch[1])) {
                    Log::info('AI parsing failed, using fallback scoring', ['content' => $content]);
                    return $this->getFallbackMatch($job, $gigWorker);
                }

                $result = [
                    'score' => min(100, (int) $scoreMatch[1]), // Cap at 100
                    'reason' => trim($reasonMatch[1] ?? 'No explanation provided'),
                    'success' => true
                ];

                // Cache the result for 24 hours
                Cache::put($cacheKey, $result, now()->addHours(24));

                return $result;
            }

            throw new \Exception('Failed to get response from OpenRouter API');

        } catch (\Exception $e) {
            Log::error('AI Match Error', [
                'job_id' => $job->id,
                'gig_worker_id' => $gigWorker->id,
                'error' => $e->getMessage()
            ]);

            // Use fallback matching if AI fails
            return $this->getFallbackMatch($job, $gigWorker);
        }
    }

    /**
     * Get matches for a specific job with AI-powered analysis
     */
    public function getJobMatches(GigJob $job, int $limit = 5): array
    {
        // Limit the number of gig workers to process to prevent timeouts
        $gigWorkers = User::where('user_type', 'gig_worker')
            ->whereNotNull('skills')
            ->whereNotNull('experience_level')
            ->limit(15) // Process max 15 gig workers for AI analysis
            ->get();

        $matches = [];
        $processedCount = 0;
        $maxProcessTime = 20; // Max 20 seconds
        $startTime = microtime(true);
        
        foreach ($gigWorkers as $gigWorker) {
            // Check timeout
            if ((microtime(true) - $startTime) > $maxProcessTime) {
                Log::warning('AI job matching timeout', [
                    'job_id' => $job->id,
                    'processed' => $processedCount
                ]);
                break;
            }
            
            // Use AI matching for accurate insights
            $match = $this->getJobMatch($job, $gigWorker);
            $processedCount++;
            
            if ($match['success'] && $match['score'] > 0) {
                $matches[] = [
                    'gig_worker' => $gigWorker,
                    'score' => $match['score'],
                    'reason' => $match['reason']
                ];
            }
            
            // Stop early if we have enough excellent matches
            if (count($matches) >= $limit * 2 && $match['score'] >= 70) {
                break;
            }
        }

        // Sort by score descending
        usort($matches, fn($a, $b) => $b['score'] - $a['score']);

        Log::info('AI gig worker matches generated', [
            'job_id' => $job->id,
            'processed_workers' => $processedCount,
            'matches_found' => count($matches),
            'time_taken' => round(microtime(true) - $startTime, 2) . 's'
        ]);

        // Return top matches
        return array_slice($matches, 0, $limit);
    }

    /**
     * Get recommended jobs for a gig worker with AI-powered matching
     */
    public function getRecommendedJobs(User $gigWorker, int $limit = 5): array
    {
        // Limit the number of jobs to process to prevent timeouts
        $jobs = GigJob::with(['employer'])
            ->where('status', 'open')
            ->whereNotNull('required_skills')
            ->whereNotNull('experience_level')
            ->limit(10) // Process max 10 jobs for AI analysis
            ->get();

        $matches = [];
        $processedCount = 0;
        $maxProcessTime = 20; // Max 20 seconds for all processing
        $startTime = microtime(true);
        
        foreach ($jobs as $job) {
            // Check if we're running out of time
            if ((microtime(true) - $startTime) > $maxProcessTime) {
                Log::warning('AI matching timeout, using processed results', [
                    'processed' => $processedCount,
                    'total_jobs' => $jobs->count()
                ]);
                break;
            }
            
            // Use AI matching for better accuracy
            $match = $this->getJobMatch($job, $gigWorker);
            $processedCount++;
            
            if ($match['success'] && $match['score'] > 0) {
                $matches[] = [
                    'job' => $job,
                    'score' => $match['score'],
                    'reason' => $match['reason']
                ];
            }
            
            // Stop early if we have enough excellent matches
            if (count($matches) >= $limit * 2 && $match['score'] >= 70) {
                break;
            }
        }

        // Sort by score descending
        usort($matches, fn($a, $b) => $b['score'] - $a['score']);

        Log::info('AI job recommendations generated', [
            'gig_worker_id' => $gigWorker->id,
            'processed_jobs' => $processedCount,
            'matches_found' => count($matches),
            'time_taken' => round(microtime(true) - $startTime, 2) . 's'
        ]);

        // Return top matches
        return array_slice($matches, 0, $limit);
    }
} 