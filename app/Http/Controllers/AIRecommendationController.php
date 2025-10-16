<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AIJobMatchingService;
use App\Models\GigJob;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Http;

class AIRecommendationController extends Controller
{
    use AIRecommendationHelpers;
    
    private AIJobMatchingService $aiJobMatchingService;

    public function __construct(AIJobMatchingService $aiJobMatchingService)
    {
        $this->aiJobMatchingService = $aiJobMatchingService;
    }

    /**
     * Show AI recommendations page with distinct interfaces for employers and gig workers
     */
    public function index(): Response
    {
        $user = auth()->user();
        $recommendations = [];
        $skills = [];
        $interfaceType = $user->user_type === 'gig_worker' ? 'job_matching' : 'talent_matching';

        try {
            // Set execution time limit to prevent timeout
            set_time_limit(30); // 30 seconds max for better AI processing
            
            if ($user->user_type === 'gig_worker') {
                // Gig Worker Interface: AI Job Match
                $recommendations = $this->getGigWorkerRecommendations($user);
            } else {
                // Employer Interface: AI GW Match (Gig Worker Match)
                $recommendations = $this->getEmployerRecommendations($user);
            }
        } catch (\Exception $e) {
            // If matching fails, return empty recommendations with error message
            \Log::error('AI Recommendations error: ' . $e->getMessage());
            $recommendations = [];
        }

        // Get skills for filtering - same methodology for both interfaces
        $skills = $this->getAvailableSkills();

        return Inertia::render('AI/Recommendations', [
            'recommendations' => $recommendations,
            'userType' => $user->user_type,
            'interfaceType' => $interfaceType,
            'hasError' => $this->hasRecommendationError($user, $recommendations),
            'skills' => $skills,
            'pageTitle' => $user->user_type === 'gig_worker' ? 'AI Job Match' : 'AI GW Match',
            'pageDescription' => $user->user_type === 'gig_worker' 
                ? 'Discover jobs that match your skills and experience using AI-powered analysis'
                : 'Find talented gig workers for your projects using AI-powered matching',
            'matchingStats' => $this->getMatchingStats($user, $recommendations),
        ]);
    }

    /**
     * Get matching statistics for the recommendations
     */
    private function getMatchingStats(User $user, array $recommendations): array
    {
        if ($user->user_type === 'gig_worker') {
            $totalJobs = count($recommendations);
            $highMatchJobs = collect($recommendations)->where('match_score', '>=', 0.8)->count();
            $avgScore = $totalJobs > 0 ? collect($recommendations)->avg('match_score') : 0;
            
            return [
                'total_matches' => $totalJobs,
                'high_quality_matches' => $highMatchJobs,
                'average_score' => round($avgScore * 100),
                'match_type' => 'jobs'
            ];
        } else {
            $totalMatches = 0;
            $highMatches = 0;
            $scores = [];
            
            foreach ($recommendations as $jobRec) {
                $matches = $jobRec['matches'] ?? [];
                $totalMatches += count($matches);
                $highMatches += collect($matches)->where('match_score', '>=', 0.8)->count();
                $scores = array_merge($scores, collect($matches)->pluck('match_score')->toArray());
            }
            
            $avgScore = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
            
            return [
                'total_matches' => $totalMatches,
                'high_quality_matches' => $highMatches,
                'average_score' => round($avgScore * 100),
                'match_type' => 'candidates'
            ];
        }
    }

    /**
     * Get AI-powered job recommendations for gig workers
     */
    private function getGigWorkerRecommendations(User $gigWorker): array
    {
        $matches = $this->aiJobMatchingService->findMatchingJobs($gigWorker, 8);
        
        // Enhanced with consistent AI insights
        return $matches->map(function ($match) use ($gigWorker) {
            $job = $match['job'];
            $score = $match['match_score'];
            
            // Apply consistent AI insights generation
            $aiInsights = $this->generateEnhancedInsights($job, $gigWorker, $score, 'job_match');
            
            return [
                'job' => $job,
                'match_score' => $score,
                'match_reasons' => $match['match_reasons'],
                'competition_level' => $match['competition_level'],
                'ai_insights' => $aiInsights,
                'success_prediction' => $this->generateSuccessPrediction($job, $gigWorker),
            ];
        })->toArray();
    }

    /**
     * Get AI-powered gig worker recommendations for employers
     */
    private function getEmployerRecommendations(User $employer): array
    {
        $recommendations = [];
        
        // Get active jobs with enhanced matching
        $activeJobs = $employer->postedJobs()
            ->where('status', 'open')
            ->limit(5) // Increased limit for better recommendations
            ->get();
            
        foreach ($activeJobs as $job) {
            $matches = $this->aiJobMatchingService->findMatchingGigWorkers($job, 5);
            
            // Enhanced with consistent AI insights
            $enhancedMatches = $matches->map(function ($match) use ($job) {
                $gigWorker = $match['gig_worker'];
                $score = $match['match_score'];
                
                // Apply consistent AI insights generation
                $aiInsights = $this->generateEnhancedInsights($job, $gigWorker, $score, 'talent_match');
                
                return [
                    'gig_worker' => $gigWorker,
                    'match_score' => $score,
                    'match_reasons' => $match['match_reasons'],
                    'ai_insights' => $aiInsights,
                    'success_prediction' => $this->generateSuccessPrediction($job, $gigWorker),
                    'portfolio_highlights' => $this->getPortfolioHighlights($gigWorker, $job),
                ];
            });
            
            $recommendations[$job->id] = [
                'job' => $job,
                'matches' => $enhancedMatches->toArray(),
                'total_matches' => $enhancedMatches->count(),
                'avg_match_score' => $enhancedMatches->avg('match_score'),
            ];
        }
        
        return $recommendations;
    }

    /**
     * Generate enhanced AI insights using META_LLAMA_L4_SCOUT_FREE
     */
    private function generateEnhancedInsights($job, $gigWorker, $score, $matchType): ?array
    {
        try {
            $apiKey = env('META_LLAMA_L4_SCOUT_FREE');
            if (!$apiKey) {
                return $this->getFallbackInsights($score, $matchType);
            }

            $prompt = $this->buildEnhancedInsightsPrompt($job, $gigWorker, $score, $matchType);
            
            $response = Http::withToken($apiKey)
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'WorkWise AI Matching'
                ])
                ->timeout(15)
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'meta-llama/llama-4-scout:free',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an expert AI talent matching specialist for the Philippine freelance market. Provide detailed, actionable insights focusing on skills compatibility, experience alignment, and success potential. Always be encouraging and professional.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'max_tokens' => 300,
                    'temperature' => 0.7
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $content = $data['choices'][0]['message']['content'] ?? '';
                
                return [
                    'summary' => $this->extractInsightSummary($content),
                    'strengths' => $this->extractStrengths($content),
                    'considerations' => $this->extractConsiderations($content),
                    'recommendation' => $this->extractRecommendation($content),
                    'confidence' => $this->getSuccessLikelihood($score)
                ];
            }
        } catch (\Exception $e) {
            \Log::error('Enhanced AI insights generation failed', [
                'error' => $e->getMessage(),
                'job_id' => $job->id ?? null,
                'gig_worker_id' => $gigWorker->id ?? null
            ]);
        }

        return $this->getFallbackInsights($score, $matchType);
    }

    /**
     * Generate AI insights for job matches (gig worker perspective)
     */
    private function generateJobMatchInsights($job, $gigWorker, float $matchScore): array
    {
        try {
            $jobData = [
                'id' => $job->id ?? $job['id'],
                'title' => $job->title ?? $job['title'],
                'description' => $job->description ?? $job['description'],
                'required_skills' => is_array($job->required_skills ?? $job['required_skills']) 
                    ? ($job->required_skills ?? $job['required_skills']) 
                    : json_decode($job->required_skills ?? $job['required_skills'] ?? '[]', true),
                'experience_level' => $job->experience_level ?? $job['experience_level'],
                'budget_range' => $this->formatBudgetRange($job)
            ];

            $gigWorkerData = [
                'id' => $gigWorker->id,
                'name' => $gigWorker->name,
                'skills' => is_array($gigWorker->skills) ? $gigWorker->skills : [],
                'experience_level' => $gigWorker->experience_level ?? 'intermediate',
                'bio' => $gigWorker->bio ?? ''
            ];

            $aiResponse = $this->aiJobMatchingService->getAIExplanation($jobData, $gigWorkerData);
            
            if ($aiResponse['success'] ?? false) {
                return [
                    'summary' => $this->extractInsightSummary($aiResponse['explanation']),
                    'strengths' => $this->extractStrengths($aiResponse['explanation']),
                    'considerations' => $this->extractConsiderations($aiResponse['explanation']),
                    'recommendation' => $this->extractRecommendation($aiResponse['explanation']),
                    'confidence' => $this->getSuccessLikelihood($matchScore)
                ];
            }

        } catch (\Exception $e) {
            \Log::error('Job match insights generation failed', [
                'error' => $e->getMessage(),
                'job_id' => $job->id ?? $job['id'] ?? null,
                'gig_worker_id' => $gigWorker->id ?? null
            ]);
        }

        return $this->getFallbackInsights($matchScore, 'job');
    }

    /**
     * Generate AI insights for talent matches (employer perspective)
     */
    private function generateTalentMatchInsights($gigWorker, $job, float $matchScore): array
    {
        try {
            $jobData = [
                'id' => $job->id ?? $job['id'],
                'title' => $job->title ?? $job['title'],
                'description' => $job->description ?? $job['description'],
                'required_skills' => is_array($job->required_skills ?? $job['required_skills']) 
                    ? ($job->required_skills ?? $job['required_skills']) 
                    : json_decode($job->required_skills ?? $job['required_skills'] ?? '[]', true),
                'experience_level' => $job->experience_level ?? $job['experience_level'],
                'budget_range' => $this->formatBudgetRange($job)
            ];

            $gigWorkerData = [
                'id' => $gigWorker->id ?? $gigWorker['id'],
                'name' => $gigWorker->name ?? $gigWorker['name'],
                'skills' => isset($gigWorker->skills) 
                    ? (is_array($gigWorker->skills) ? $gigWorker->skills : []) 
                    : ($gigWorker['skills'] ?? []),
                'experience_level' => $gigWorker->experience_level ?? $gigWorker['experience_level'] ?? 'intermediate',
                'bio' => $gigWorker->bio ?? $gigWorker['bio'] ?? ''
            ];

            $aiResponse = $this->aiJobMatchingService->getAIExplanation($jobData, $gigWorkerData);
            
            if ($aiResponse['success'] ?? false) {
                return [
                    'summary' => $this->extractInsightSummary($aiResponse['explanation']),
                    'strengths' => $this->extractStrengths($aiResponse['explanation']),
                    'considerations' => $this->extractConsiderations($aiResponse['explanation']),
                    'recommendation' => $this->extractRecommendation($aiResponse['explanation']),
                    'confidence' => $this->getSuccessLikelihood($matchScore)
                ];
            }

        } catch (\Exception $e) {
            \Log::error('Talent match insights generation failed', [
                'error' => $e->getMessage(),
                'job_id' => $job->id ?? $job['id'] ?? null,
                'gig_worker_id' => $gigWorker->id ?? $gigWorker['id'] ?? null
            ]);
        }

        return $this->getFallbackInsights($matchScore, 'talent');
    }

    /**
     * Get fallback insights when AI generation fails
     */
    private function getFallbackInsights(float $score, string $matchType): array
     {
         $confidence = $this->getSuccessLikelihood($score);
         
         if ($matchType === 'job') {
             return [
                 'summary' => 'This job appears to be a good match based on your profile.',
                 'strengths' => ['Skills alignment', 'Experience compatibility'],
                 'considerations' => ['Review job requirements carefully', 'Prepare a strong proposal'],
                 'recommendation' => 'Consider applying with a tailored proposal highlighting your relevant experience.',
                 'confidence' => $confidence
             ];
         } else {
             return [
                 'summary' => 'This candidate shows strong potential for your project.',
                 'strengths' => ['Relevant skills', 'Good experience match'],
                 'considerations' => ['Review portfolio samples', 'Conduct thorough interview'],
                 'recommendation' => 'Consider reaching out to discuss project requirements in detail.',
                 'confidence' => $confidence
             ];
         }
     }

    /**
     * Get compatibility breakdown for detailed analysis
     */
    private function getCompatibilityBreakdown($job, $gigWorker): array
    {
        $jobSkills = is_array($job->required_skills ?? []) ? $job->required_skills : json_decode($job->required_skills ?? '[]', true);
        $workerSkills = is_array($gigWorker->skills) ? $gigWorker->skills : [];
        
        return [
            'skills_match' => $this->calculateSkillsCompatibility($jobSkills, $workerSkills),
            'experience_match' => $this->calculateExperienceCompatibility($job->experience_level ?? 'intermediate', $gigWorker->experience_level ?? 'intermediate'),
            'budget_match' => $this->calculateBudgetCompatibility($job, $gigWorker),
            'overall_compatibility' => $this->calculateOverallCompatibility($job, $gigWorker)
        ];
    }

    /**
     * Format budget range for display
     */
    private function formatBudgetRange($job): string
    {
        $min = $job->budget_min ?? $job['budget_min'] ?? 0;
        $max = $job->budget_max ?? $job['budget_max'] ?? 0;
        
        if ($min && $max) {
            return "₱{$min} - ₱{$max}";
        } elseif ($min) {
            return "₱{$min}+";
        } elseif ($max) {
            return "Up to ₱{$max}";
        }
        
        return 'Budget not specified';
    }

    /**
     * Build enhanced insights prompt for consistent methodology
     */
    private function buildEnhancedInsightsPrompt($job, $gigWorker, $score, $matchType): string
    {
        $jobSkills = is_array($job->required_skills) ? implode(', ', $job->required_skills) : '';
        $workerSkills = is_array($gigWorker->skills) ? implode(', ', $gigWorker->skills) : '';
        
        $context = $matchType === 'job_match' 
            ? "analyzing job suitability for a gig worker"
            : "evaluating gig worker suitability for a job";
            
        return "Context: {$context}

Job Details:
- Title: {$job->title}
- Required Skills: {$jobSkills}
- Experience Level: {$job->experience_level}
- Budget: ₱{$job->budget_min}-₱{$job->budget_max}

Gig Worker Profile:
- Name: {$gigWorker->first_name} {$gigWorker->last_name}
- Skills: {$workerSkills}
- Experience Level: {$gigWorker->experience_level}
- Hourly Rate: ₱{$gigWorker->hourly_rate}

Match Score: {$score}

Please provide:
1. SUMMARY: Brief overview of the match quality
2. STRENGTHS: Key advantages and skill alignments
3. CONSIDERATIONS: Potential challenges or gaps
4. RECOMMENDATION: Specific advice for success

Focus on skills compatibility, experience alignment, and practical success factors.";
    }

    /**
     * Generate success prediction using consistent methodology
     */
    private function generateSuccessPrediction($job, $gigWorker): ?array
    {
        $jobSkills = is_array($job->required_skills ?? []) ? $job->required_skills : json_decode($job->required_skills ?? '[]', true);
        $workerSkills = is_array($gigWorker->skills) ? $gigWorker->skills : [];
        
        $skillsMatch = $this->calculateSkillsCompatibility($jobSkills, $workerSkills);
        $experienceMatch = $this->calculateExperienceCompatibility($job->experience_level ?? 'intermediate', $gigWorker->experience_level ?? 'intermediate');
        $budgetMatch = $this->calculateBudgetCompatibility($job, $gigWorker);
        
        $overallScore = ($skillsMatch * 0.5) + ($experienceMatch * 0.3) + ($budgetMatch * 0.2);
        
        return [
            'overall_score' => round($overallScore * 100),
            'skills_compatibility' => round($skillsMatch * 100),
            'experience_alignment' => round($experienceMatch * 100),
            'budget_compatibility' => round($budgetMatch * 100),
            'success_likelihood' => $this->getSuccessLikelihood($overallScore),
        ];
    }

    /**
     * Calculate skills compatibility between job requirements and worker skills
     */
    private function calculateSkillsCompatibility(array $jobSkills, array $workerSkills): float
    {
        if (empty($jobSkills)) {
            return 0.8; // Default score when no specific skills required
        }
        
        if (empty($workerSkills)) {
            return 0.0; // No skills means no match
        }
        
        $normalizedJobSkills = array_map('strtolower', array_map('trim', $jobSkills));
        $normalizedWorkerSkills = array_map('strtolower', array_map('trim', $workerSkills));
        
        // Direct matches
        $directMatches = array_intersect($normalizedJobSkills, $normalizedWorkerSkills);
        $directMatchScore = count($directMatches) / count($normalizedJobSkills);
        
        // Partial matches (for similar skills)
        $partialMatches = 0;
        foreach ($normalizedJobSkills as $required) {
            if (!in_array($required, $directMatches)) {
                foreach ($normalizedWorkerSkills as $workerSkill) {
                    if (str_contains($workerSkill, $required) || str_contains($required, $workerSkill)) {
                        $partialMatches++;
                        break;
                    }
                }
            }
        }
        
        $partialMatchScore = ($partialMatches * 0.5) / count($normalizedJobSkills);
        $totalMatchScore = $directMatchScore + $partialMatchScore;
        
        // Bonus for having more skills than required (up to 20% bonus)
        $extraSkillsBonus = min(0.2, (count($normalizedWorkerSkills) - count($normalizedJobSkills)) * 0.02);
        
        return min(1.0, $totalMatchScore + $extraSkillsBonus);
    }

    /**
     * Calculate experience compatibility
     */
    private function calculateExperienceCompatibility(string $jobLevel, string $workerLevel): float
    {
        $levels = [
            'entry' => 1, 
            'beginner' => 1,
            'intermediate' => 2, 
            'expert' => 3, 
            'senior' => 3,
            'advanced' => 3
        ];
        
        $jobLevelNum = $levels[strtolower($jobLevel)] ?? 2;
        $workerLevelNum = $levels[strtolower($workerLevel)] ?? 2;
        
        $difference = abs($jobLevelNum - $workerLevelNum);
        
        // Perfect match = 1.0, one level off = 0.7, two levels off = 0.3
        return match($difference) {
            0 => 1.0,
            1 => 0.7,
            default => 0.3
        };
    }

    /**
     * Calculate budget compatibility
     */
    private function calculateBudgetCompatibility($job, $gigWorker): float
    {
        $jobBudgetMax = $job->budget_max ?? $job['budget_max'] ?? null;
        $workerRate = $gigWorker->hourly_rate ?? $gigWorker['hourly_rate'] ?? null;
        
        if (!$jobBudgetMax || !$workerRate) {
            return 0.7; // Default score when budget info is missing
        }
        
        // Assume 40 hours for project estimation
        $estimatedProjectCost = $workerRate * 40;
        
        if ($estimatedProjectCost <= $jobBudgetMax) {
            return 1.0;
        } else {
            $ratio = $jobBudgetMax / $estimatedProjectCost;
            return max(0, $ratio);
        }
    }

    /**
     * Calculate overall compatibility score using consistent methodology
     */
    private function calculateOverallCompatibility($job, $gigWorker): float
    {
        $jobSkills = is_array($job->required_skills ?? []) ? $job->required_skills : json_decode($job->required_skills ?? '[]', true);
        $workerSkills = $gigWorker->skills ? $gigWorker->skills->pluck('name')->toArray() : [];
        
        // Use the same weighting as AIJobMatchingService: 70% skills, 30% experience
        $skillsMatch = $this->calculateSkillsCompatibility($jobSkills, $workerSkills);
        $experienceMatch = $this->calculateExperienceCompatibility($job->experience_level ?? 'intermediate', $gigWorker->experience_level ?? 'intermediate');
        
        return ($skillsMatch * 0.7) + ($experienceMatch * 0.3);
    }

    /**
     * Get success likelihood description
     */
    private function getSuccessLikelihood(float $score): string
    {
        if ($score >= 0.8) {
            return 'Very High';
        } elseif ($score >= 0.6) {
            return 'High';
        } elseif ($score >= 0.4) {
            return 'Moderate';
        } elseif ($score >= 0.2) {
            return 'Low';
        } else {
            return 'Very Low';
        }
    }

    /**
     * Extract insight summary from AI response
     */
    private function extractInsightSummary(string $content): string
    {
        if (preg_match('/SUMMARY[:\s]*([^\n]+)/i', $content, $matches)) {
            return trim($matches[1]);
        }
        
        // Fallback: use first sentence
        $sentences = explode('.', $content);
        return trim($sentences[0] ?? 'Good match potential based on profile analysis.');
    }

    /**
     * Extract strengths from AI response
     */
    private function extractStrengths(string $content): array
    {
        if (preg_match('/STRENGTHS[:\s]*([^\n]+)/i', $content, $matches)) {
            return array_map('trim', explode(',', $matches[1]));
        }
        
        return ['Skills alignment', 'Experience compatibility'];
    }

    /**
     * Extract considerations from AI response
     */
    private function extractConsiderations(string $content): array
    {
        if (preg_match('/CONSIDERATIONS[:\s]*([^\n]+)/i', $content, $matches)) {
            return array_map('trim', explode(',', $matches[1]));
        }
        
        return ['Review requirements carefully', 'Prepare detailed proposal'];
    }

    /**
     * Extract recommendation from AI response
     */
    private function extractRecommendation(string $content): string
    {
        if (preg_match('/RECOMMENDATION[:\s]*([^\n]+)/i', $content, $matches)) {
            return trim($matches[1]);
        }
        
        return 'Consider proceeding with a detailed discussion about project requirements.';
    }

    /**
     * Get portfolio highlights for gig worker
     */
    private function getPortfolioHighlights($gigWorker, $job): array
    {
        // This would typically fetch relevant portfolio items
        // For now, return a placeholder structure
        return [
            'relevant_projects' => 0,
            'similar_experience' => false,
            'skill_demonstrations' => []
        ];
    }

    /**
     * Get available skills using consistent methodology
     */
    private function getAvailableSkills(): array
    {
        $skills = collect(
            GigJob::query()
                ->whereNotNull('required_skills')
                ->pluck('required_skills')
                ->toArray()
        )
            ->filter()
            ->reduce(function (array $unique, $skillSet) {
                $skillsArray = is_array($skillSet)
                    ? $skillSet
                    : (json_decode($skillSet, true) ?: []);

                foreach ($skillsArray as $skill) {
                    $trimmed = trim((string) $skill);
                    if ($trimmed === '') continue;

                    $normalized = strtolower($trimmed);
                    if (!array_key_exists($normalized, $unique)) {
                        $unique[$normalized] = $trimmed;
                    }
                }
                return $unique;
            }, []);

        return collect($skills)
            ->values()
            ->sort(fn ($a, $b) => strcasecmp($a, $b))
            ->values()
            ->all();
    }

    /**
     * Check if there's a recommendation error
     */
    private function hasRecommendationError(User $user, array $recommendations): bool
    {
        if ($user->user_type === 'gig_worker') {
            return empty($recommendations);
        } else {
            return empty($recommendations) && $user->postedJobs()->where('status', 'open')->exists();
        }
    }

    /**
     * Test OpenRouter API connectivity
     */
    public function testConnection()
    {
        try {
            // Use META_LLAMA_L4_SCOUT_FREE API key from .env file
            $apiKey = env('META_LLAMA_L4_SCOUT_FREE') ?: config('services.openrouter.api_key');
            $certPath = base_path('cacert.pem');
            
            if (empty($apiKey)) {
                return response()->json([
                    'success' => false,
                    'message' => 'META_LLAMA_L4_SCOUT_FREE API key is not configured in .env file'
                ]);
            }

            $response = Http::withToken($apiKey)
                ->withOptions([
                    'verify' => $certPath
                ])
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'WorkWise Job Matching'
                ])
                ->post(config('services.openrouter.base_url') . '/chat/completions', [
                    'model' => 'meta-llama/llama-4-scout:free',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a helpful assistant.'],
                        ['role' => 'user', 'content' => 'Hi, this is a test message.']
                    ]
                ]);

            $data = $response->json();
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'API Connection Successful',
                    'data' => $data
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'API request failed',
                'error' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'API Connection Failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Retrieve all unique required skills across all jobs.
     */
    public function allSkills()
    {
        $skills = collect(
            GigJob::query()
                ->whereNotNull('required_skills')
                ->pluck('required_skills')
                ->toArray()
        )
            ->filter()
            ->reduce(function (array $unique, $skillSet) {
                $skillsArray = is_array($skillSet)
                    ? $skillSet
                    : (json_decode($skillSet, true) ?: []);

                foreach ($skillsArray as $skill) {
                    $trimmed = trim((string) $skill);

                    if ($trimmed === '') {
                        continue;
                    }

                    $normalized = strtolower($trimmed);

                    if (!array_key_exists($normalized, $unique)) {
                        $unique[$normalized] = $trimmed;
                    }
                }

                return $unique;
            }, []);

        $skills = collect($skills)
            ->values()
            ->sort(fn ($a, $b) => strcasecmp($a, $b))
            ->values()
            ->all();

        return response()->json($skills);
    }

    public function recommendSkills(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'exclude' => 'array',
            'exclude.*' => 'string',
        ]);

        $title = $validated['title'] ?? '';
        $description = $validated['description'] ?? '';
        $exclude = $validated['exclude'] ?? [];

        $service = app(AIJobMatchingService::class);
        $result = $service->recommend($title, $description, $exclude);

        return response()->json($result);
    }

    public function acceptSuggestion(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:skill,role',
            'value' => 'required|string',
            'context' => 'nullable|array',
        ]);

        $service = app(AIJobMatchingService::class);
        $service->recordAcceptance($validated['type'], $validated['value'], $validated['context'] ?? []);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Get AI-powered gig worker matches for a specific job
     */
    public function getAiGigWorkerMatches(Request $request, GigJob $job)
    {
        try {
            // Verify the job belongs to the authenticated employer
            if ($job->employer_id !== auth()->id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $page = $request->get('page', 1);
            $perPage = 10;
            $offset = ($page - 1) * $perPage;

            // Get all available gig workers
            $gigWorkers = User::where('user_type', 'gig_worker')
                ->where('is_active', true)
                ->with(['gigWorkerProfile', 'receivedReviews'])
                ->get();

            if ($gigWorkers->isEmpty()) {
                return response()->json([
                    'matches' => [],
                    'has_more' => false,
                    'total' => 0
                ]);
            }

            // Calculate compatibility scores for each gig worker
            $matches = [];
            foreach ($gigWorkers as $gigWorker) {
                $score = $this->calculateCompatibilityScore($job, $gigWorker);
                if ($score > 0) {
                    $matches[] = [
                        'gig_worker' => $gigWorker,
                        'compatibility_score' => $score,
                        'ai_insights' => $this->generateAiInsights($job, $gigWorker, $score)
                    ];
                }
            }

            // Sort by compatibility score (highest first)
            usort($matches, function ($a, $b) {
                return $b['compatibility_score'] <=> $a['compatibility_score'];
            });

            // Apply pagination
            $totalMatches = count($matches);
            $paginatedMatches = array_slice($matches, $offset, $perPage);
            $hasMore = ($offset + $perPage) < $totalMatches;

            // Format the response
            $formattedMatches = array_map(function ($match) {
                $gigWorker = $match['gig_worker'];
                $profile = $gigWorker->gigWorkerProfile;
                
                return [
                    'id' => $gigWorker->id,
                    'name' => $gigWorker->name,
                    'title' => $profile->title ?? 'Gig Worker',
                    'compatibility_score' => $match['compatibility_score'],
                    'skills' => $profile ? explode(',', $profile->skills) : [],
                    'experience' => $profile->experience_level ?? 'Not specified',
                    'hourly_rate' => $profile->hourly_rate ?? null,
                    'availability' => $profile->availability ?? 'Not specified',
                    'location' => $profile->location ?? 'Not specified',
                    'rating' => $gigWorker->receivedReviews->avg('rating') ?? 0,
                    'total_reviews' => $gigWorker->receivedReviews->count(),
                    'ai_insights' => $match['ai_insights']
                ];
            }, $paginatedMatches);

            return response()->json([
                'matches' => $formattedMatches,
                'has_more' => $hasMore,
                'total' => $totalMatches,
                'current_page' => $page
            ]);

        } catch (\Exception $e) {
            \Log::error('AI Gig Worker Matching error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch matches'], 500);
        }
    }

    /**
     * Calculate compatibility score between a job and gig worker
     */
    private function calculateCompatibilityScore(GigJob $job, User $gigWorker): int
    {
        $score = 0;
        $profile = $gigWorker->gigWorkerProfile;

        if (!$profile) {
            return 0;
        }

        // Skills matching (40% weight)
        $jobSkills = array_map('trim', explode(',', strtolower($job->required_skills ?? '')));
        $workerSkills = array_map('trim', explode(',', strtolower($profile->skills ?? '')));
        
        $matchingSkills = array_intersect($jobSkills, $workerSkills);
        $skillsScore = count($jobSkills) > 0 ? (count($matchingSkills) / count($jobSkills)) * 40 : 0;
        $score += $skillsScore;

        // Experience level matching (25% weight)
        $experienceMapping = [
            'entry' => 1,
            'intermediate' => 2,
            'expert' => 3
        ];
        
        $jobExperience = $experienceMapping[$job->experience_level] ?? 2;
        $workerExperience = $experienceMapping[$profile->experience_level] ?? 2;
        
        if ($workerExperience >= $jobExperience) {
            $score += 25;
        } elseif ($workerExperience == $jobExperience - 1) {
            $score += 15;
        }

        // Budget compatibility (20% weight)
        if ($profile->hourly_rate && $job->budget_type === 'hourly') {
            $budgetMax = $job->budget_max ?? $job->budget_min ?? 0;
            if ($budgetMax > 0 && $profile->hourly_rate <= $budgetMax) {
                $score += 20;
            } elseif ($budgetMax > 0 && $profile->hourly_rate <= $budgetMax * 1.2) {
                $score += 10;
            }
        } else {
            $score += 10; // Neutral score for fixed budget or missing rate
        }

        // Rating and reviews (15% weight)
        $avgRating = $gigWorker->receivedReviews->avg('rating') ?? 0;
        $reviewCount = $gigWorker->receivedReviews->count();
        
        if ($avgRating >= 4.5 && $reviewCount >= 5) {
            $score += 15;
        } elseif ($avgRating >= 4.0 && $reviewCount >= 3) {
            $score += 10;
        } elseif ($avgRating >= 3.5) {
            $score += 5;
        }

        return min(100, max(0, round($score)));
    }

    /**
     * Generate AI insights for a job-gig worker match
     */
    private function generateAiInsights(GigJob $job, User $gigWorker, int $score): array
    {
        $insights = [];
        $profile = $gigWorker->gigWorkerProfile;

        if (!$profile) {
            return ['No profile information available'];
        }

        // Skills analysis
        $jobSkills = array_map('trim', explode(',', strtolower($job->required_skills ?? '')));
        $workerSkills = array_map('trim', explode(',', strtolower($profile->skills ?? '')));
        $matchingSkills = array_intersect($jobSkills, $workerSkills);
        
        if (count($matchingSkills) > 0) {
            $insights[] = "Strong match: " . count($matchingSkills) . " of " . count($jobSkills) . " required skills";
        }

        // Experience insights
        $experienceMapping = [
            'entry' => 'Entry Level',
            'intermediate' => 'Intermediate',
            'expert' => 'Expert'
        ];
        
        $jobExp = $experienceMapping[$job->experience_level] ?? 'Not specified';
        $workerExp = $experienceMapping[$profile->experience_level] ?? 'Not specified';
        
        if ($profile->experience_level === $job->experience_level) {
            $insights[] = "Perfect experience match: {$workerExp} level";
        } elseif ($profile->experience_level === 'expert' && $job->experience_level !== 'expert') {
            $insights[] = "Overqualified: Expert level for {$jobExp} position";
        }

        // Budget insights
        if ($profile->hourly_rate && $job->budget_type === 'hourly') {
            $budgetMax = $job->budget_max ?? $job->budget_min ?? 0;
            if ($budgetMax > 0) {
                if ($profile->hourly_rate <= $budgetMax) {
                    $insights[] = "Budget compatible: \${$profile->hourly_rate}/hr within \${$budgetMax}/hr budget";
                } else {
                    $insights[] = "Above budget: \${$profile->hourly_rate}/hr exceeds \${$budgetMax}/hr budget";
                }
            }
        }

        // Rating insights
        $avgRating = $gigWorker->receivedReviews->avg('rating') ?? 0;
        $reviewCount = $gigWorker->receivedReviews->count();
        
        if ($avgRating >= 4.5 && $reviewCount >= 5) {
            $insights[] = "Highly rated: {$avgRating}/5 stars from {$reviewCount} reviews";
        } elseif ($reviewCount === 0) {
            $insights[] = "New to platform: No reviews yet";
        }

        return $insights;
    }
}
