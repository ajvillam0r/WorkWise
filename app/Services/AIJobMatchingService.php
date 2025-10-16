<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\GigJob;
use App\Models\User;
use App\Models\Bid;
use Illuminate\Support\Collection;

class AIJobMatchingService
{
    protected AIService $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }
    /**
         * Find matching gig workers for a job using AI-like algorithm
         */
        public function findMatchingGigWorkers(GigJob $job, int $limit = 10): Collection
    {
        $gigWorkers = User::where('user_type', 'gig_worker')
            ->where('profile_completed', true)
            ->get();

        return $gigWorkers->map(function ($gigWorker) use ($job) {
            $score = $this->calculateMatchScore($job, $gigWorker);
            return [
                'gig_worker' => $gigWorker,
                'match_score' => $score,
                'match_reasons' => $this->getMatchReasons($job, $gigWorker, $score)
            ];
        })
        ->filter(fn($match) => $match['match_score'] > 0.1) // Show more matches (10% threshold)
        ->sortByDesc('match_score')
        ->take($limit)
        ->values();
    }

    /**
     * Find matching jobs for a gig worker
     */
    public function findMatchingJobs(User $gigWorker, int $limit = 20): Collection
    {
        $jobs = GigJob::with(['employer']) // Load employer relationship
            ->where('status', 'open')
            ->where('employer_id', '!=', $gigWorker->id)
            ->whereDoesntHave('bids', function($query) use ($gigWorker) {
                $query->where('gig_worker_id', $gigWorker->id);
            })
            ->get();

        return $jobs->map(function ($job) use ($gigWorker) {
            $score = $this->calculateMatchScore($job, $gigWorker);
            return [
                'job' => $job,
                'match_score' => $score,
                'match_reasons' => $this->getMatchReasons($job, $gigWorker, $score),
                'competition_level' => $this->calculateCompetitionLevel($job)
            ];
        })
        ->filter(fn($match) => $match['match_score'] > 0.1) // Show more matches (10% threshold)
        ->sortByDesc('match_score')
        ->take($limit)
        ->values();
    }

    /**
     * Calculate match score between job and gig worker
     */
    private function calculateMatchScore(GigJob $job, User $gigWorker): float
    {
        $score = 0.0;
        $maxScore = 1.0;

        // Skills matching (70% weight) - Primary factor
        $skillsScore = $this->calculateSkillsMatch($job->required_skills, $gigWorker->skills ?? []);
        $score += $skillsScore * 0.7;

        // Experience level matching (30% weight) - Secondary factor
        $experienceScore = $this->calculateExperienceMatch($job->experience_level, $gigWorker);
        $score += $experienceScore * 0.3;

        // Remove all other factors (budget, location, reputation, availability)
        // Focus only on skills and experience level

        return min($score, $maxScore);
    }

    /**
     * Calculate skills matching score
     */
    private function calculateSkillsMatch(array $requiredSkills, array $gigWorkerSkills): float
    {
        if (empty($requiredSkills) || empty($gigWorkerSkills)) {
            return 0.0;
        }

        // Normalize skills for better matching
        $requiredSkills = array_map(function($skill) {
            return strtolower(trim($skill));
        }, $requiredSkills);

        $gigWorkerSkills = array_map(function($skill) {
            return strtolower(trim($skill));
        }, $gigWorkerSkills);

        // Direct matches
        $directMatches = array_intersect($requiredSkills, $gigWorkerSkills);
        $directMatchScore = count($directMatches) / count($requiredSkills);

        // Partial matches (for similar skills)
        $partialMatches = 0;
        foreach ($requiredSkills as $required) {
            if (!in_array($required, $directMatches)) {
                foreach ($gigWorkerSkills as $gigWorker) {
                    if (str_contains($gigWorker, $required) || str_contains($required, $gigWorker)) {
                        $partialMatches++;
                        break;
                    }
                }
            }
        }

        $partialMatchScore = ($partialMatches * 0.5) / count($requiredSkills);
        $totalMatchScore = $directMatchScore + $partialMatchScore;

        // Bonus for having more skills than required
        $extraSkillsBonus = min(0.2, (count($gigWorkerSkills) - count($requiredSkills)) * 0.02);

        return min(1.0, $totalMatchScore + $extraSkillsBonus);
    }

    /**
     * Calculate experience level match
     */
    private function calculateExperienceMatch(string $requiredLevel, User $gigWorker): float
    {
        $levelMap = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        $required = $levelMap[$requiredLevel] ?? 2;

        // Use gig worker's set experience level if available, otherwise estimate
        if ($gigWorker->experience_level) {
            $gigWorkerLevel = $levelMap[$gigWorker->experience_level] ?? 2;
        } else {
            // Fallback: Estimate gig worker level based on completed projects and ratings
            $completedProjects = $gigWorker->gigWorkerProjects()->where('status', 'completed')->count();
            $avgRating = $gigWorker->receivedReviews()->avg('rating') ?? 3;

            $gigWorkerLevel = 1; // Default beginner
            if ($completedProjects >= 10 && $avgRating >= 4.5) {
                $gigWorkerLevel = 3; // Expert
            } elseif ($completedProjects >= 3 && $avgRating >= 4.0) {
                $gigWorkerLevel = 2; // Intermediate
            }
        }

        // Perfect match = 1.0, one level off = 0.7, two levels off = 0.3
        $difference = abs($required - $gigWorkerLevel);
        return match($difference) {
            0 => 1.0,
            1 => 0.7,
            default => 0.3
        };
    }

    /**
     * Calculate budget compatibility
     */
    private function calculateBudgetMatch(GigJob $job, User $gigWorker): float
    {
        $gigWorkerRate = $gigWorker->hourly_rate ?? 25; // Default rate
        $jobBudgetMin = $job->budget_min ?? 0;
        $jobBudgetMax = $job->budget_max ?? 1000;

        if ($job->budget_type === 'hourly') {
            // For hourly jobs, compare rates directly
            if ($gigWorkerRate >= $jobBudgetMin && $gigWorkerRate <= $jobBudgetMax) {
                return 1.0;
            } elseif ($gigWorkerRate < $jobBudgetMin) {
                return max(0.0, 1.0 - (($jobBudgetMin - $gigWorkerRate) / $jobBudgetMin));
            } else {
                return max(0.0, 1.0 - (($gigWorkerRate - $jobBudgetMax) / $jobBudgetMax));
            }
        } else {
            // For fixed jobs, estimate based on duration and hourly rate
            $estimatedHours = ($job->estimated_duration_days ?? 7) * 6; // 6 hours per day
            $gigWorkerEstimate = $gigWorkerRate * $estimatedHours;
            
            if ($gigWorkerEstimate >= $jobBudgetMin && $gigWorkerEstimate <= $jobBudgetMax) {
                return 1.0;
            } else {
                $midpoint = ($jobBudgetMin + $jobBudgetMax) / 2;
                $difference = abs($gigWorkerEstimate - $midpoint);
                return max(0.0, 1.0 - ($difference / $midpoint));
            }
        }
    }

    /**
     * Calculate location match (Lapu-Lapu City focus)
     */
    private function calculateLocationMatch(GigJob $job, User $gigWorker): float
    {
        // Both in Lapu-Lapu City = perfect match
        if ($gigWorker->barangay && $job->location) {
            return 1.0; // Both local
        }
        
        // Remote work preference
        if ($job->is_remote) {
            return 0.8; // Good for remote
        }
        
        return 0.5; // Neutral
    }

    /**
     * Calculate gig worker reputation score
     */
    private function calculateReputationScore(User $gigWorker): float
    {
        $avgRating = $gigWorker->receivedReviews()->avg('rating') ?? 3.0;
        $reviewCount = $gigWorker->receivedReviews()->count();
        $completedProjects = $gigWorker->gigWorkerProjects()->where('status', 'completed')->count();

        // Base score from rating
        $ratingScore = ($avgRating - 1) / 4; // Convert 1-5 to 0-1

        // Bonus for having reviews and completed projects
        $experienceBonus = min(0.3, ($reviewCount * 0.05) + ($completedProjects * 0.02));

        return min(1.0, $ratingScore + $experienceBonus);
    }

    /**
     * Calculate availability score
     */
    private function calculateAvailabilityScore(User $gigWorker): float
    {
        $activeProjects = $gigWorker->gigWorkerProjects()->where('status', 'active')->count();
        
        // Less active projects = more available
        return match(true) {
            $activeProjects === 0 => 1.0,
            $activeProjects <= 2 => 0.8,
            $activeProjects <= 4 => 0.5,
            default => 0.2
        };
    }

    /**
     * Calculate competition level for a job
     */
    private function calculateCompetitionLevel(GigJob $job): string
    {
        $bidCount = $job->bids()->count();
        
        return match(true) {
            $bidCount === 0 => 'No competition',
            $bidCount <= 3 => 'Low competition',
            $bidCount <= 8 => 'Medium competition',
            $bidCount <= 15 => 'High competition',
            default => 'Very high competition'
        };
    }

    /**
     * Get human-readable match reasons with AI enhancement
     */
    private function getMatchReasons(GigJob $job, User $gigWorker, float $score): array
    {
        $reasons = [];

        // Try to get AI-powered explanation first
        if ($this->aiService->isAvailable()) {
            $aiExplanation = $this->getAIExplanation($job, $gigWorker, $score);
            if ($aiExplanation) {
                $reasons[] = "🤖 AI Analysis: " . $aiExplanation;
            }
        }

        // Skills match with details (Primary factor)
        $skillsMatch = $this->calculateSkillsMatch($job->required_skills, $gigWorker->skills ?? []);
        $requiredSkills = array_map('strtolower', $job->required_skills);
        $gigWorkerSkills = array_map('strtolower', $gigWorker->skills ?? []);
        $matchingSkills = array_intersect($requiredSkills, $gigWorkerSkills);

        if ($skillsMatch > 0.8) {
            $reasons[] = "✅ Excellent skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } elseif ($skillsMatch > 0.5) {
            $reasons[] = "✅ Good skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } elseif ($skillsMatch > 0.2) {
            $reasons[] = "⚠️ Partial skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } elseif ($skillsMatch > 0) {
            $reasons[] = "⚠️ Some skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } else {
            $reasons[] = "❌ No direct skills match - consider learning: " . implode(', ', array_slice($job->required_skills, 0, 3));
        }

        // Experience level details (Secondary factor)
        $experienceMatch = $this->calculateExperienceMatch($job->experience_level, $gigWorker);
        if ($experienceMatch > 0.8) {
            $reasons[] = "🎯 Perfect experience level match ({$gigWorker->experience_level} = {$job->experience_level})";
        } elseif ($experienceMatch > 0.5) {
            $reasons[] = "🎯 Good experience level match ({$gigWorker->experience_level} ≈ {$job->experience_level})";
        } elseif ($gigWorker->experience_level) {
            $reasons[] = "📊 Experience level: {$gigWorker->experience_level} (required: {$job->experience_level})";
        } else {
            $reasons[] = "📋 Experience level not specified in profile";
        }

        // Add success prediction if AI is available
        if ($this->aiService->isAvailable()) {
            $prediction = $this->getAISuccessPrediction($job, $gigWorker);
            if ($prediction && $prediction['success']) {
                $probability = $prediction['prediction']['probability'];
                $reasons[] = "🔮 AI Success Prediction: {$probability}% chance of successful project completion";
            }
        }

        // If no reasons found, provide basic info
        if (empty($reasons)) {
            $reasons[] = "📝 Limited match - consider updating your skills and experience level";
        }

        return $reasons;
    }

    /**
     * Get AI-powered explanation for match
     */
    private function getAIExplanation(GigJob $job, User $gigWorker, float $score): ?string
    {
        if (!$this->aiService->isAvailable()) {
            return null;
        }

        try {
            $jobData = [
                'id' => $job->id,
                'title' => $job->title,
                'description' => $job->description,
                'required_skills' => $job->required_skills ?? [],
                'experience_level' => $job->experience_level
            ];

            $gigWorkerData = [
                'id' => $gigWorker->id,
                'name' => $gigWorker->first_name . ' ' . $gigWorker->last_name,
                'skills' => $gigWorker->skills ?? [],
                'experience_level' => $gigWorker->experience_level,
                'bio' => $gigWorker->bio
            ];

            return $this->aiService->generateMatchExplanation($jobData, $gigWorkerData, $score);
        } catch (\Exception $e) {
            \Log::error('AI explanation generation failed', [
                'job_id' => $job->id,
                'gig_worker_id' => $gigWorker->id,
                'error' => $e->getMessage()
            ]);
            return $this->getFallbackExplanation($jobData, $gigWorkerData, $score);
        }
    }

    private function getAISuccessPrediction(GigJob $job, User $gigWorker): ?array
    {
        if (!$this->aiService->isAvailable()) {
            return null;
        }

        try {
            $jobData = [
                'id' => $job->id,
                'title' => $job->title,
                'description' => $job->description,
                'required_skills' => $job->required_skills ?? [],
                'experience_level' => $job->experience_level
            ];

            $gigWorkerData = [
                'id' => $gigWorker->id,
                'name' => $gigWorker->first_name . ' ' . $gigWorker->last_name,
                'skills' => $gigWorker->skills ?? [],
                'experience_level' => $gigWorker->experience_level
            ];

            return $this->aiService->generateSuccessPrediction($jobData, $gigWorkerData);
        } catch (\Exception $e) {
            \Log::error('AI success prediction failed', [
                'job_id' => $job->id,
                'gig_worker_id' => $gigWorker->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get job recommendations for gig worker
     */
    public function getJobRecommendations(User $gigWorker): array
    {
        $matches = $this->findMatchingJobs($gigWorker, 10);

        return [
            'matches' => $matches->toArray(),
            'total_jobs' => GigJob::where('status', 'open')->count(),
            'match_count' => $matches->count(),
            'suggested_improvements' => $this->getSuggestedImprovements($gigWorker)
        ];
    }

    /**
     * Get suggested improvements for gig worker
     */
    private function getSuggestedImprovements(User $gigWorker): array
    {
        $suggestions = [];

        if (!$gigWorker->skills || count($gigWorker->skills) < 3) {
            $suggestions[] = "Add more skills to your profile to increase job matches";
        }

        if (!$gigWorker->bio || strlen($gigWorker->bio) < 100) {
            $suggestions[] = "Write a detailed bio to attract more employers";
        }

        if (!$gigWorker->hourly_rate) {
            $suggestions[] = "Set your hourly rate to help employers understand your pricing";
        }

        $reviewCount = $gigWorker->receivedReviews()->count();
        if ($reviewCount < 5) {
            $suggestions[] = "Complete more projects to build your reputation";
        }

        return $suggestions;
    }

    /**
     * Get AI-powered skill recommendations for gig worker
     */
    public function getAISkillRecommendations(User $gigWorker): array
    {
        if (!$this->aiService->isAvailable()) {
            return [
                'success' => false,
                'message' => 'AI service is not available'
            ];
        }

        try {
            $gigWorkerData = [
                'id' => $gigWorker->id,
                'name' => $gigWorker->first_name . ' ' . $gigWorker->last_name,
                'skills' => $gigWorker->skills ?? [],
                'experience_level' => $gigWorker->experience_level,
                'bio' => $gigWorker->bio
            ];

            // Get market trends data
            $marketTrends = [
                'trending_skills' => $this->getTrendingSkills(),
                'high_demand_skills' => $this->getHighDemandSkills(),
                'emerging_technologies' => $this->getEmergingTechnologies()
            ];

            return $this->aiService->generateSkillRecommendations($gigWorkerData, $marketTrends);
        } catch (\Exception $e) {
            \Log::error('AI skill recommendations failed', [
                'gig_worker_id' => $gigWorker->id,
                'error' => $e->getMessage()
            ]);
            return [
                'success' => false,
                'message' => 'Failed to generate skill recommendations'
            ];
        }
    }

    /**
     * Get AI-powered job recommendations for gig worker
     */
    public function getAIJobRecommendations(User $gigWorker): array
    {
        $matches = $this->findMatchingJobs($gigWorker, 10);

        $enhancedMatches = $matches->map(function ($match) use ($gigWorker) {
            $job = $match['job'];
            
            $aiExplanation = $this->getAIExplanation($match['job'], $gigWorker, $match['match_score']);
            
            // Get AI success prediction
            $prediction = $this->getAISuccessPrediction($match['job'], $gigWorker);
            
            return array_merge($match, [
                'ai_explanation' => $aiExplanation,
                'success_prediction' => $prediction
            ]);
        });

        return [
            'matches' => $enhancedMatches->toArray(),
            'total_jobs' => GigJob::where('status', 'open')->count(),
            'match_count' => $matches->count(),
            'suggested_improvements' => $this->getSuggestedImprovements($gigWorker),
        ];
    }

    /**
     * Get AI-powered gig worker recommendations for a job
     */
    public function getAIMatchingGigWorkers(GigJob $job): array
    {
        $matches = $this->findMatchingGigWorkers($job, 20);

        $enhancedMatches = $matches->map(function ($match) use ($job) {
            // Get AI explanation for this match
            $aiExplanation = $this->getAIExplanation($job, $match['gig_worker'], $match['match_score']);
            
            // Get AI success prediction
            $prediction = $this->getAISuccessPrediction($job, $match['gig_worker']);
            
            return array_merge($match, [
                'ai_explanation' => $aiExplanation,
                'success_prediction' => $prediction
            ]);
        });

        return [
            'matches' => $enhancedMatches->toArray(),
            'total_gig_workers' => User::where('user_type', 'gig_worker')->count(),
            'match_count' => $matches->count()
        ];
    }

    /**
     * Enhanced AI-powered job recommendations with portfolio analysis and name verification
     */
    public function getEnhancedAIJobRecommendations(User $gigWorker): array
    {
        $matches = $this->findMatchingJobs($gigWorker, 10);

        $enhancedMatches = $matches->map(function ($match) use ($gigWorker) {
            $job = $match['job'];
            
            // Get comprehensive AI analysis
            $comprehensiveAnalysis = $this->getComprehensiveMatchAnalysis($job, $gigWorker, $match['match_score']);
            
            // Enhanced matching score with portfolio validation
            $enhancedScore = $this->calculateEnhancedMatchScore($job, $gigWorker);
            
            return array_merge($match, [
                'enhanced_match_score' => $enhancedScore,
                'comprehensive_analysis' => $comprehensiveAnalysis,
                'portfolio_validation' => $this->validatePortfolioSkills($gigWorker, $job),
                'identity_verification' => $this->verifyIdentityConsistency($gigWorker),
                'quantitative_assessment' => $this->getQuantitativeSkillsAssessment($job, $gigWorker),
                'qualitative_assessment' => $this->getQualitativeExperienceAssessment($job, $gigWorker)
            ]);
        });

        return [
            'matches' => $enhancedMatches->toArray(),
            'total_jobs' => GigJob::where('status', 'open')->count(),
            'match_count' => $matches->count(),
            'suggested_improvements' => $this->getSuggestedImprovements($gigWorker),
            'portfolio_insights' => $this->getPortfolioInsights($gigWorker),
        ];
    }

    /**
     * Calculate enhanced match score with portfolio validation
     */
    private function calculateEnhancedMatchScore(GigJob $job, User $gigWorker): float
    {
        $baseScore = $this->calculateMatchScore($job, $gigWorker);
        
        // Portfolio validation bonus (up to 20% increase)
        $portfolioBonus = $this->calculatePortfolioBonus($gigWorker, $job);
        
        // Identity verification bonus (up to 10% increase)
        $identityBonus = $this->calculateIdentityVerificationBonus($gigWorker);
        
        // Experience quality bonus (up to 15% increase)
        $experienceBonus = $this->calculateExperienceQualityBonus($gigWorker, $job);
        
        $enhancedScore = $baseScore + ($baseScore * ($portfolioBonus + $identityBonus + $experienceBonus));
        
        return min(1.0, $enhancedScore);
    }

    /**
     * Get comprehensive AI match analysis
     */
    private function getComprehensiveMatchAnalysis(GigJob $job, User $gigWorker, float $matchScore): array
    {
        if (!$this->aiService->isAvailable()) {
            return [
                'success' => false,
                'message' => 'AI service not available for comprehensive analysis'
            ];
        }

        try {
            $jobData = [
                'id' => $job->id,
                'title' => $job->title,
                'description' => $job->description,
                'required_skills' => $job->required_skills ?? [],
                'experience_level' => $job->experience_level,
                'budget' => $job->budget,
                'currency' => $job->currency ?? 'PHP',
                'category' => $job->category
            ];

            $gigWorkerData = [
                'id' => $gigWorker->id,
                'name' => $gigWorker->first_name . ' ' . $gigWorker->last_name,
                'skills' => $gigWorker->skills ?? [],
                'experience_level' => $gigWorker->experience_level,
                'hourly_rate' => $gigWorker->hourly_rate,
                'currency' => $gigWorker->currency ?? 'PHP',
                'bio' => $gigWorker->bio
            ];

            // Get portfolio data
            $portfolioData = $this->getPortfolioDataForAnalysis($gigWorker);

            return $this->aiService->generateEnhancedMatchExplanation($jobData, $gigWorkerData, $portfolioData, $matchScore);
        } catch (\Exception $e) {
            \Log::error('Comprehensive AI analysis failed', [
                'job_id' => $job->id,
                'gig_worker_id' => $gigWorker->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to generate comprehensive analysis'
            ];
        }
    }

    /**
     * Get portfolio data for AI analysis
     */
    private function getPortfolioDataForAnalysis(User $gigWorker): array
    {
        $freelancerProfile = $gigWorker->freelancerProfile;
        if (!$freelancerProfile) {
            return [];
        }

        $portfolios = $freelancerProfile->portfolios()->get();
        
        return $portfolios->map(function ($portfolio) {
            return [
                'title' => $portfolio->title ?? 'Untitled Project',
                'description' => $portfolio->description ?? '',
                'project_type' => $portfolio->project_type ?? 'General',
                'technologies' => $portfolio->technologies ?? [],
                'images' => $portfolio->images ?? [],
                'created_at' => $portfolio->created_at
            ];
        })->toArray();
    }

    /**
     * Validate portfolio skills against claimed skills
     */
    private function validatePortfolioSkills(User $gigWorker, GigJob $job): array
    {
        $freelancer = $gigWorker->freelancerProfile;
        if (!$freelancer) {
            return [
                'validation_status' => 'no_portfolio',
                'verified_skills' => [],
                'unverified_skills' => $gigWorker->skills ?? [],
                'portfolio_skill_match' => 0.0,
                'recommendations' => ['Create a portfolio to showcase your skills']
            ];
        }

        $portfolios = $freelancer->portfolios()->public()->get();
        $claimedSkills = array_map('strtolower', $gigWorker->skills ?? []);
        $jobRequiredSkills = array_map('strtolower', $job->required_skills ?? []);
        
        $verifiedSkills = [];
        $portfolioSkills = [];
        
        foreach ($portfolios as $portfolio) {
            $techUsed = array_map('strtolower', $portfolio->technologies_used ?? []);
            $portfolioSkills = array_merge($portfolioSkills, $techUsed);
            
            // Check if portfolio description mentions skills
            $description = strtolower($portfolio->description ?? '');
            foreach ($claimedSkills as $skill) {
                if (str_contains($description, $skill) || in_array($skill, $techUsed)) {
                    $verifiedSkills[] = $skill;
                }
            }
        }
        
        $verifiedSkills = array_unique($verifiedSkills);
        $unverifiedSkills = array_diff($claimedSkills, $verifiedSkills);
        
        // Calculate portfolio-job skill match
        $portfolioJobMatch = count(array_intersect($portfolioSkills, $jobRequiredSkills));
        $portfolioSkillMatch = count($jobRequiredSkills) > 0 ? $portfolioJobMatch / count($jobRequiredSkills) : 0;
        
        return [
            'validation_status' => count($portfolios) > 0 ? 'has_portfolio' : 'no_portfolio',
            'verified_skills' => $verifiedSkills,
            'unverified_skills' => $unverifiedSkills,
            'portfolio_skills' => array_unique($portfolioSkills),
            'portfolio_skill_match' => $portfolioSkillMatch,
            'portfolio_count' => count($portfolios),
            'relevant_portfolios' => $portfolios->filter(function($portfolio) use ($jobRequiredSkills) {
                $techUsed = array_map('strtolower', $portfolio->technologies_used ?? []);
                return count(array_intersect($techUsed, $jobRequiredSkills)) > 0;
            })->count(),
            'recommendations' => $this->getPortfolioRecommendations($verifiedSkills, $unverifiedSkills, $jobRequiredSkills)
        ];
    }

    /**
     * Verify identity consistency between profile and portfolio
     */
    private function verifyIdentityConsistency(User $gigWorker): array
    {
        $freelancer = $gigWorker->freelancerProfile;
        $profileName = trim(($gigWorker->first_name ?? '') . ' ' . ($gigWorker->last_name ?? ''));
        
        if (!$freelancer) {
            return [
                'verification_status' => 'no_freelancer_profile',
                'consistency_score' => 0.0,
                'issues' => ['No freelancer profile found'],
                'recommendations' => ['Complete your freelancer profile']
            ];
        }

        $portfolios = $freelancer->portfolios()->get();
        $issues = [];
        $consistencyScore = 1.0;
        
        // Check portfolio client names for consistency
        foreach ($portfolios as $portfolio) {
            if ($portfolio->client_name && !empty(trim($portfolio->client_name))) {
                // This is where we would implement name similarity checking
                // For now, we'll do basic checks
                $clientName = trim($portfolio->client_name);
                if (strlen($clientName) < 2) {
                    $issues[] = "Portfolio '{$portfolio->title}' has incomplete client name";
                    $consistencyScore -= 0.1;
                }
            }
        }
        
        // Check profile completeness
        if (empty($profileName) || strlen($profileName) < 3) {
            $issues[] = 'Profile name is incomplete';
            $consistencyScore -= 0.3;
        }
        
        if (empty($gigWorker->email_verified_at)) {
            $issues[] = 'Email not verified';
            $consistencyScore -= 0.2;
        }
        
        $consistencyScore = max(0.0, $consistencyScore);
        
        return [
            'verification_status' => count($issues) === 0 ? 'verified' : 'needs_attention',
            'consistency_score' => $consistencyScore,
            'profile_name' => $profileName,
            'portfolio_count' => count($portfolios),
            'issues' => $issues,
            'recommendations' => $this->getIdentityRecommendations($issues)
        ];
    }

    /**
     * Get quantitative skills assessment
     */
    private function getQuantitativeSkillsAssessment(GigJob $job, User $gigWorker): array
    {
        $requiredSkills = array_map('strtolower', $job->required_skills ?? []);
        $workerSkills = array_map('strtolower', $gigWorker->skills ?? []);
        
        $directMatches = array_intersect($requiredSkills, $workerSkills);
        $partialMatches = [];
        
        // Find partial matches
        foreach ($requiredSkills as $required) {
            if (!in_array($required, $directMatches)) {
                foreach ($workerSkills as $worker) {
                    if (str_contains($worker, $required) || str_contains($required, $worker)) {
                        $partialMatches[] = ['required' => $required, 'worker' => $worker];
                        break;
                    }
                }
            }
        }
        
        $matchPercentage = count($requiredSkills) > 0 ? (count($directMatches) / count($requiredSkills)) * 100 : 0;
        
        return [
            'total_required_skills' => count($requiredSkills),
            'total_worker_skills' => count($workerSkills),
            'direct_matches' => count($directMatches),
            'partial_matches' => count($partialMatches),
            'match_percentage' => round($matchPercentage, 1),
            'direct_match_skills' => $directMatches,
            'partial_match_details' => $partialMatches,
            'missing_skills' => array_diff($requiredSkills, $directMatches),
            'extra_skills' => array_diff($workerSkills, $requiredSkills),
            'skill_coverage_score' => $this->calculateSkillCoverageScore($directMatches, $partialMatches, $requiredSkills)
        ];
    }

    /**
     * Get qualitative experience assessment
     */
    private function getQualitativeExperienceAssessment(GigJob $job, User $gigWorker): array
    {
        $freelancer = $gigWorker->freelancerProfile;
        
        if (!$freelancer) {
            return [
                'assessment_status' => 'no_profile',
                'experience_score' => 0.0,
                'recommendations' => ['Complete your freelancer profile to improve matching']
            ];
        }

        $experiences = $freelancer->experiences()->get();
        $portfolios = $freelancer->portfolios()->get();
        
        // Analyze experience relevance
        $relevantExperience = 0;
        $totalExperience = count($experiences);
        $jobSkills = array_map('strtolower', $job->required_skills ?? []);
        
        foreach ($experiences as $experience) {
            $expSkills = array_map('strtolower', $experience->skills_used ?? []);
            $skillOverlap = count(array_intersect($expSkills, $jobSkills));
            if ($skillOverlap > 0) {
                $relevantExperience++;
            }
        }
        
        // Analyze portfolio relevance
        $relevantPortfolios = 0;
        foreach ($portfolios as $portfolio) {
            $portfolioSkills = array_map('strtolower', $portfolio->technologies_used ?? []);
            $skillOverlap = count(array_intersect($portfolioSkills, $jobSkills));
            if ($skillOverlap > 0) {
                $relevantPortfolios++;
            }
        }
        
        $experienceScore = $this->calculateExperienceRelevanceScore($relevantExperience, $totalExperience, $relevantPortfolios, count($portfolios));
        
        return [
            'assessment_status' => 'completed',
            'experience_score' => $experienceScore,
            'total_experiences' => $totalExperience,
            'relevant_experiences' => $relevantExperience,
            'total_portfolios' => count($portfolios),
            'relevant_portfolios' => $relevantPortfolios,
            'experience_relevance_percentage' => $totalExperience > 0 ? round(($relevantExperience / $totalExperience) * 100, 1) : 0,
            'portfolio_relevance_percentage' => count($portfolios) > 0 ? round(($relevantPortfolios / count($portfolios)) * 100, 1) : 0,
            'recommendations' => $this->getExperienceRecommendations($relevantExperience, $totalExperience, $relevantPortfolios, count($portfolios))
        ];
    }

    // Helper methods for calculations and recommendations

    private function calculatePortfolioBonus(User $gigWorker, GigJob $job): float
    {
        $validation = $this->validatePortfolioSkills($gigWorker, $job);
        return min(0.2, $validation['portfolio_skill_match'] * 0.2);
    }

    private function calculateIdentityVerificationBonus(User $gigWorker): float
    {
        $verification = $this->verifyIdentityConsistency($gigWorker);
        return min(0.1, $verification['consistency_score'] * 0.1);
    }

    private function calculateExperienceQualityBonus(User $gigWorker, GigJob $job): float
    {
        $assessment = $this->getQualitativeExperienceAssessment($job, $gigWorker);
        return min(0.15, $assessment['experience_score'] * 0.15);
    }

    private function calculateSkillCoverageScore(array $directMatches, array $partialMatches, array $requiredSkills): float
    {
        if (count($requiredSkills) === 0) return 1.0;
        
        $directScore = count($directMatches) * 1.0;
        $partialScore = count($partialMatches) * 0.5;
        $totalScore = ($directScore + $partialScore) / count($requiredSkills);
        
        return min(1.0, $totalScore);
    }

    private function calculateExperienceRelevanceScore(int $relevantExp, int $totalExp, int $relevantPortfolios, int $totalPortfolios): float
    {
        $expScore = $totalExp > 0 ? $relevantExp / $totalExp : 0;
        $portfolioScore = $totalPortfolios > 0 ? $relevantPortfolios / $totalPortfolios : 0;
        
        // Weight experience and portfolio equally
        return ($expScore + $portfolioScore) / 2;
    }

    private function getPortfolioRecommendations(array $verified, array $unverified, array $jobRequired): array
    {
        $recommendations = [];
        
        if (count($unverified) > 0) {
            $recommendations[] = "Add portfolio projects showcasing: " . implode(', ', array_slice($unverified, 0, 3));
        }
        
        $missingJobSkills = array_diff($jobRequired, $verified);
        if (count($missingJobSkills) > 0) {
            $recommendations[] = "Create projects demonstrating: " . implode(', ', array_slice($missingJobSkills, 0, 3));
        }
        
        if (empty($recommendations)) {
            $recommendations[] = "Your portfolio effectively demonstrates your skills!";
        }
        
        return $recommendations;
    }

    private function getIdentityRecommendations(array $issues): array
    {
        $recommendations = [];
        
        foreach ($issues as $issue) {
            if (str_contains($issue, 'email')) {
                $recommendations[] = "Verify your email address to improve trust";
            } elseif (str_contains($issue, 'name')) {
                $recommendations[] = "Complete your profile name information";
            } elseif (str_contains($issue, 'client name')) {
                $recommendations[] = "Add complete client information to your portfolio projects";
            }
        }
        
        if (empty($recommendations)) {
            $recommendations[] = "Your identity verification looks good!";
        }
        
        return $recommendations;
    }

    private function getExperienceRecommendations(int $relevantExp, int $totalExp, int $relevantPortfolios, int $totalPortfolios): array
    {
        $recommendations = [];
        
        if ($totalExp === 0) {
            $recommendations[] = "Add your work experience to strengthen your profile";
        } elseif ($relevantExp < $totalExp * 0.5) {
            $recommendations[] = "Highlight more relevant experience for better job matching";
        }
        
        if ($totalPortfolios === 0) {
            $recommendations[] = "Create portfolio projects to showcase your skills";
        } elseif ($relevantPortfolios < $totalPortfolios * 0.5) {
            $recommendations[] = "Add more portfolio projects relevant to your target jobs";
        }
        
        if (empty($recommendations)) {
            $recommendations[] = "Your experience profile is well-aligned with job requirements!";
        }
        
        return $recommendations;
    }

    private function getPortfolioInsights(User $gigWorker): array
    {
        $freelancer = $gigWorker->freelancerProfile;
        if (!$freelancer) {
            return ['status' => 'no_profile', 'insights' => []];
        }

        $portfolios = $freelancer->portfolios()->get();
        $insights = [];
        
        if (count($portfolios) === 0) {
            $insights[] = "No portfolio items found - consider adding projects to showcase your skills";
        } else {
            $insights[] = "Portfolio contains " . count($portfolios) . " project(s)";
            
            $publicCount = $portfolios->where('is_public', true)->count();
            if ($publicCount < count($portfolios)) {
                $insights[] = (count($portfolios) - $publicCount) . " portfolio item(s) are private - make them public to improve visibility";
            }
            
            $featuredCount = $portfolios->where('is_featured', true)->count();
            if ($featuredCount === 0) {
                $insights[] = "Consider featuring your best portfolio items";
            }
        }
        
        return ['status' => 'analyzed', 'insights' => $insights];
    }

    private function suggestEmergingSkills(string $title, string $description, array $exclude = []): array
    {
        $text = Str::lower($title . ' ' . $description);
        $catalog = [
            'AI Prompt Engineering',
            'Generative AI (Stable Diffusion, Midjourney)',
            'LangChain',
            'LLM Fine-tuning',
            'RAG (Retrieval Augmented Generation)',
            'Web3 dApp Integration',
            'Solana Development',
            'AR/VR Prototyping',
            'Edge Functions (Cloudflare Workers, Vercel Edge)',
            'Serverless Automation (Zapier, n8n, Make.com)',
            'DataOps',
            'MLOps',
        ];
        $signals = [
            'ai' => 2, 'ml' => 2, 'machine learning' => 2, 'llm' => 3, 'chatgpt' => 3,
            'web3' => 2, 'blockchain' => 2, 'solidity' => 2, 'ethereum' => 2,
            'ar' => 2, 'vr' => 2,
            'automation' => 2, 'serverless' => 2,
            'data' => 1, 'analytics' => 1, 'ops' => 1,
        ];

        $score = [];
        foreach ($signals as $kw => $w) {
            if (Str::contains($text, $kw)) {
                foreach ($catalog as $s) {
                    $score[$s] = ($score[$s] ?? 0) + $w;
                }
            }
        }

        // Exclude already chosen skills
        foreach ($exclude as $ex) {
            foreach ($catalog as $s) {
                if (Str::lower($s) === Str::lower($ex)) {
                    unset($score[$s]);
                }
            }
        }

        arsort($score);
        return array_slice(array_keys($score), 0, 8);
    }

    protected function suggestInnovativeRoles(string $title, string $description, array $skills): array
    {
        $text = Str::lower($title . ' ' . $description);
        $roles = [
            ['signals' => ['ai', 'marketing'], 'role' => 'AI Marketing Strategist'],
            ['signals' => ['ai', 'content'], 'role' => 'AI Content Architect'],
            ['signals' => ['web3', 'frontend'], 'role' => 'Web3 Frontend Engineer'],
            ['signals' => ['data', 'ops'], 'role' => 'DataOps Engineer'],
            ['signals' => ['ml', 'ops'], 'role' => 'MLOps Engineer'],
            ['signals' => ['automation', 'no-code'], 'role' => 'Automation Solutions Architect'],
            ['signals' => ['ar', 'vr', 'design'], 'role' => 'XR Experience Designer'],
        ];

        $out = [];
        foreach ($roles as $r) {
            $hit = 0;
            foreach ($r['signals'] as $sig) {
                if (Str::contains($text, $sig)) $hit++;
                foreach ($skills as $s) {
                    if (Str::contains(Str::lower($s), $sig)) $hit++;
                }
            }
            if ($hit >= 2) {
                $out[] = $r['role'];
            }
        }

        return array_values(array_unique($out));
    }

    public function recordAcceptance(string $type, string $value, array $context = []): void
    {
        SkillRecommendationStat::query()->updateOrCreate(
            ['type' => $type, 'value' => $value],
            [
                'accepted_count' => \DB::raw('accepted_count + 1'),
                'last_accepted_at' => now(),
                'context' => $context,
            ]
        );
    }
}
