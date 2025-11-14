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
        // Use QWEN_API_KEY for Groq API
        $this->apiKey = env('QWEN_API_KEY');
        $this->model = 'llama-3.1-8b-instant';
        $this->baseUrl = 'https://api.groq.com/openai/v1';
        $this->certPath = base_path('cacert.pem');
        $this->isConfigured = !empty($this->apiKey);

        if (!$this->isConfigured) {
            Log::warning('QWEN_API_KEY is not configured. AI matching will use fallback mode.');
        } else {
            Log::info('AI matching configured with Groq API (llama-3.1-8b-instant)');
        }
    }

    /**
     * Extract job skills for matching, prioritizing structured data
     * 
     * @param GigJob $job
     * @return array ['required' => [...], 'preferred' => [...], 'all_skill_names' => [...]]
     */
    private function getJobSkillsForMatching(GigJob $job): array
    {
        // Prioritize skills_requirements (structured data)
        if (!empty($job->skills_requirements)) {
            $required = array_filter($job->skills_requirements, fn($s) => 
                ($s['importance'] ?? 'required') === 'required'
            );
            
            $preferred = array_filter($job->skills_requirements, fn($s) => 
                ($s['importance'] ?? 'required') === 'preferred'
            );
            
            $allSkillNames = array_map(fn($s) => $s['skill'], $job->skills_requirements);
            
            return [
                'required' => array_values($required),
                'preferred' => array_values($preferred),
                'all_skill_names' => $allSkillNames
            ];
        }
        
        // Fallback to required_skills (legacy)
        $requiredSkills = $job->required_skills ?? [];
        $defaultExperienceLevel = $job->experience_level ?? 'intermediate';
        
        $required = array_map(fn($skill) => [
            'skill' => $skill,
            'experience_level' => $defaultExperienceLevel,
            'importance' => 'required'
        ], $requiredSkills);
        
        return [
            'required' => $required,
            'preferred' => [],
            'all_skill_names' => $requiredSkills
        ];
    }

    /**
     * Compare experience levels and return difference
     * 
     * @param string $workerLevel
     * @param string $requiredLevel
     * @return int Positive if worker exceeds requirement, negative if below, 0 if equal
     */
    private function compareExperienceLevels(string $workerLevel, string $requiredLevel): int
    {
        $levels = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        $workerValue = $levels[strtolower($workerLevel)] ?? 2;
        $requiredValue = $levels[strtolower($requiredLevel)] ?? 2;
        
        return $workerValue - $requiredValue;
    }

    /**
     * Find a specific skill in worker's skill set
     * 
     * @param array $workerSkills
     * @param string $skillName
     * @return array|null
     */
    private function findWorkerSkill(array $workerSkills, string $skillName): ?array
    {
        $skillNameLower = strtolower($skillName);
        
        foreach ($workerSkills as $skill) {
            if (isset($skill['skill']) && strtolower($skill['skill']) === $skillNameLower) {
                return $skill;
            }
        }
        
        return null;
    }

    /**
     * Calculate skill match score with experience level consideration
     * 
     * @param array $jobSkills Result from getJobSkillsForMatching()
     * @param array $workerSkills Worker's skills_with_experience array
     * @return array ['score' => int, 'details' => array, 'required_matches' => int, 'required_total' => int, 'preferred_matches' => int]
     */
    private function calculateSkillMatchScore(array $jobSkills, array $workerSkills): array
    {
        $score = 0;
        $matchDetails = [];
        
        // Required skills matching (70% weight)
        $requiredMatches = 0;
        $requiredTotal = count($jobSkills['required']);
        
        foreach ($jobSkills['required'] as $requiredSkill) {
            $skillName = $requiredSkill['skill'];
            $requiredLevel = $requiredSkill['experience_level'] ?? 'intermediate';
            
            // Check if worker has this skill
            $workerSkill = $this->findWorkerSkill($workerSkills, $skillName);
            
            if ($workerSkill) {
                $requiredMatches++;
                $workerLevel = $workerSkill['experience_level'] ?? 'intermediate';
                
                // Bonus for experience level match
                $levelComparison = $this->compareExperienceLevels($workerLevel, $requiredLevel);
                
                if ($levelComparison >= 0) {
                    $score += 10; // Experience level meets or exceeds requirement
                    $matchDetails[] = "✓ {$skillName} ({$workerLevel})";
                } else {
                    $score += 5; // Has skill but lower experience
                    $matchDetails[] = "~ {$skillName} (needs more experience)";
                }
            }
        }
        
        $requiredScore = $requiredTotal > 0 
            ? ($requiredMatches / $requiredTotal) * 70 
            : 0;
        
        // Preferred skills matching (30% weight)
        $preferredMatches = 0;
        $preferredTotal = count($jobSkills['preferred']);
        
        foreach ($jobSkills['preferred'] as $preferredSkill) {
            $skillName = $preferredSkill['skill'];
            $workerSkill = $this->findWorkerSkill($workerSkills, $skillName);
            
            if ($workerSkill) {
                $preferredMatches++;
                $matchDetails[] = "+ {$skillName} (bonus)";
            }
        }
        
        $preferredScore = $preferredTotal > 0 
            ? ($preferredMatches / $preferredTotal) * 30 
            : 30; // Full bonus if no preferred skills specified
        
        return [
            'score' => (int) min(100, $requiredScore + $preferredScore + $score),
            'details' => $matchDetails,
            'required_matches' => $requiredMatches,
            'required_total' => $requiredTotal,
            'preferred_matches' => $preferredMatches
        ];
    }

    /**
     * Generate human-readable match explanation from match details
     * 
     * @param array $matchResult Result from calculateSkillMatchScore()
     * @param array $jobSkills Result from getJobSkillsForMatching()
     * @return string
     */
    private function generateMatchExplanation(array $matchResult, array $jobSkills): string
    {
        $explanations = [];
        
        // Required skills summary
        if ($matchResult['required_total'] > 0) {
            $requiredPercent = round(($matchResult['required_matches'] / $matchResult['required_total']) * 100);
            
            if ($matchResult['required_matches'] === $matchResult['required_total']) {
                $explanations[] = "Perfect match on all {$matchResult['required_total']} required skills";
            } elseif ($matchResult['required_matches'] > 0) {
                $explanations[] = "Matches {$matchResult['required_matches']} of {$matchResult['required_total']} required skills ({$requiredPercent}%)";
            } else {
                $explanations[] = "Missing required skills - consider upskilling";
            }
        }
        
        // Preferred skills summary
        if ($matchResult['preferred_matches'] > 0) {
            $explanations[] = "Bonus: {$matchResult['preferred_matches']} preferred skill(s) matched";
        }
        
        // Specific skill details
        if (!empty($matchResult['details'])) {
            $detailsText = implode(', ', array_slice($matchResult['details'], 0, 5));
            $explanations[] = $detailsText;
        }
        
        // Skill gaps
        $missingRequired = $matchResult['required_total'] - $matchResult['required_matches'];
        if ($missingRequired > 0) {
            $missingSkills = [];
            foreach ($jobSkills['required'] as $requiredSkill) {
                $found = false;
                foreach ($matchResult['details'] as $detail) {
                    if (str_contains($detail, $requiredSkill['skill'])) {
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $missingSkills[] = $requiredSkill['skill'];
                }
            }
            
            if (!empty($missingSkills)) {
                $missingList = implode(', ', array_slice($missingSkills, 0, 3));
                $explanations[] = "Consider learning: {$missingList}";
            }
        }
        
        return implode('. ', $explanations);
    }

    /**
     * Get match score between a job and a gig worker using keyword matching as fallback
     */
    private function getFallbackMatch(GigJob $job, User $gigWorker): array
    {
        // Try to use structured skill matching if available
        $jobSkills = $this->getJobSkillsForMatching($job);
        $workerSkills = $gigWorker->skills_with_experience ?? [];
        
        // If worker has structured skills, use the new matching algorithm
        if (!empty($workerSkills) && !empty($jobSkills['all_skill_names'])) {
            $matchResult = $this->calculateSkillMatchScore($jobSkills, $workerSkills);
            $explanation = $this->generateMatchExplanation($matchResult, $jobSkills);
            
            return [
                'score' => (int) round($matchResult['score']),
                'reason' => $explanation,
                'success' => true
            ];
        }
        
        // Legacy fallback for workers without structured skills
        $score = 0;
        $reasons = [];

        // Quick validation - return early if no skills data
        $workerSkillsLegacy = $gigWorker->skills ?? [];
        if (empty($workerSkillsLegacy) || empty($jobSkills['all_skill_names'])) {
            return [
                'score' => 10, // Minimal score for having a profile
                'reason' => 'Basic profile match - consider for general opportunities',
                'success' => true
            ];
        }

        // Compare required skills with optimized matching
        $gigWorkerSkills = array_map('strtolower', $workerSkillsLegacy);
        $jobSkillsLower = array_map('strtolower', $jobSkills['all_skill_names']);

        // Direct matches (most important)
        $matchingSkills = array_intersect($gigWorkerSkills, $jobSkillsLower);
        
        // Quick partial matching (limit to prevent timeout)
        $partialMatches = [];
        $maxPartialChecks = min(5, count($jobSkillsLower)); // Limit partial match checks
        
        foreach (array_slice($jobSkillsLower, 0, $maxPartialChecks) as $jobSkill) {
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
            ? min(100, (count($matchingSkills) / count($jobSkillsLower)) * 100)
            : 0;

        $partialMatchScore = count($partialMatches) > 0
            ? min(50, (count($partialMatches) / count($jobSkillsLower)) * 50) // Partial matches worth 50% of direct, max 50
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
            'score' => (int) min(100, round($score)), // Cap at 100
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
            // Get structured job skills
            $jobSkills = $this->getJobSkillsForMatching($job);
            
            // Build required skills text with experience levels
            $requiredSkillsText = '';
            if (!empty($jobSkills['required'])) {
                $requiredSkillsList = array_map(fn($s) => 
                    "{$s['skill']} ({$s['experience_level']})", 
                    $jobSkills['required']
                );
                $requiredSkillsText = implode(', ', $requiredSkillsList);
            } else {
                $requiredSkillsText = implode(', ', $jobSkills['all_skill_names']);
            }
            
            // Build preferred skills text if available
            $preferredSkillsText = '';
            if (!empty($jobSkills['preferred'])) {
                $preferredSkillsList = array_map(fn($s) => 
                    "{$s['skill']} ({$s['experience_level']})", 
                    $jobSkills['preferred']
                );
                $preferredSkillsText = "\nPreferred Skills: " . implode(', ', $preferredSkillsList);
            }
            
            // Prepare job description
            $jobText = "Job Title: {$job->title}\n" .
                      "Description: {$job->description}\n" .
                      "Required Skills: {$requiredSkillsText}" .
                      $preferredSkillsText . "\n" .
                      "Experience Level: {$job->experience_level}\n" .
                      "Budget: ₱{$job->budget_min} - ₱{$job->budget_max} ({$job->budget_type})";

            // Prepare gig worker profile with structured skills if available
            $workerSkills = $gigWorker->skills_with_experience ?? [];
            $experienceLevel = $gigWorker->experience_level ?? 'Not specified';
            $hourlyRate = $gigWorker->hourly_rate ?? 'Not set';
            $professionalTitle = $gigWorker->professional_title ?? 'Not specified';
            
            // Format worker skills with experience levels
            $workerSkillsText = '';
            if (!empty($workerSkills)) {
                $workerSkillsList = array_map(fn($s) => 
                    "{$s['skill']} ({$s['experience_level']})", 
                    $workerSkills
                );
                $workerSkillsText = implode(', ', $workerSkillsList);
            } else {
                $legacySkills = $gigWorker->skills ?? [];
                $workerSkillsText = empty($legacySkills) ? 'No skills listed' : implode(', ', $legacySkills);
            }

            $gigWorkerText = "Your Profile:\n" .
                            "Professional Title: {$professionalTitle}\n" .
                            "Skills: {$workerSkillsText}\n" .
                            "Experience Level: {$experienceLevel}\n" .
                            "Hourly Rate: ₱{$hourlyRate}\n" .
                            "Bio: " . substr($gigWorker->bio ?? 'No bio provided', 0, 150);

            // Make API call to Groq
            $response = Http::withToken($this->apiKey)
                ->withOptions([
                    'verify' => $this->certPath
                ])
                ->timeout(30)
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
                    'temperature' => 1,
                    'max_completion_tokens' => 1024,
                    'top_p' => 1,
                    'stream' => false
                ]);

            if ($response->successful()) {
                $responseData = $response->json();
                
                // Log full response for debugging
                Log::debug('Groq API Response', ['response' => $responseData]);
                
                // Check if response has expected structure
                if (!isset($responseData['choices'][0]['message']['content'])) {
                    Log::error('Groq API response missing expected structure', ['response' => $responseData]);
                    throw new \Exception('Invalid response structure from Groq API');
                }
                
                $content = $responseData['choices'][0]['message']['content'];
                
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

            throw new \Exception('Failed to get response from Groq API: ' . $response->status());

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
            ->whereNotNull('skills_with_experience')
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