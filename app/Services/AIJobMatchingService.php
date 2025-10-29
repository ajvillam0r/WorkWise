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
    public function findMatchingFreelancers(GigJob $job, int $limit = 10): Collection
    {
        $freelancers = User::where('user_type', 'gig_worker')
            ->where('profile_completed', true)
            ->get();

        return $freelancers->map(function ($freelancer) use ($job) {
            $score = $this->calculateMatchScore($job, $freelancer);
            return [
                'freelancer' => $freelancer,
                'match_score' => $score,
                'match_reasons' => $this->getMatchReasons($job, $freelancer, $score)
            ];
        })
        ->filter(fn($match) => $match['match_score'] > 0.1) // Show more matches (10% threshold)
        ->sortByDesc('match_score')
        ->take($limit)
        ->values();
    }

    /**
     * Find matching jobs for a freelancer
     */
    public function findMatchingJobs(User $freelancer, int $limit = 20): Collection
    {
        $jobs = GigJob::with(['employer']) // Load employer relationship
            ->where('status', 'open')
            ->where('employer_id', '!=', $freelancer->id)
            ->whereDoesntHave('bids', function($query) use ($freelancer) {
                $query->where('freelancer_id', $freelancer->id);
            })
            ->get();

        return $jobs->map(function ($job) use ($freelancer) {
            $score = $this->calculateMatchScore($job, $freelancer);
            return [
                'job' => $job,
                'match_score' => $score,
                'match_reasons' => $this->getMatchReasons($job, $freelancer, $score),
                'competition_level' => $this->calculateCompetitionLevel($job)
            ];
        })
        ->filter(fn($match) => $match['match_score'] > 0.1) // Show more matches (10% threshold)
        ->sortByDesc('match_score')
        ->take($limit)
        ->values();
    }

    /**
     * Extract skills from skills_with_experience with experience weighting
     */
    private function getFreelancerSkills(User $freelancer): array
    {
        if (empty($freelancer->skills_with_experience)) {
            return [];
        }

        return array_map(function($item) {
            return [
                'skill' => strtolower(trim($item['skill'])),
                'experience_level' => $item['experience_level'] ?? 'intermediate',
                'weight' => match($item['experience_level'] ?? 'intermediate') {
                    'beginner' => 1.0,
                    'intermediate' => 1.5,
                    'expert' => 2.0,
                    default => 1.0
                }
            ];
        }, $freelancer->skills_with_experience);
    }

    /**
     * Calculate match score between job and freelancer
     */
    private function calculateMatchScore(GigJob $job, User $freelancer): float
    {
        $score = 0.0;
        $maxScore = 1.0;

        // Get freelancer skills with experience levels
        $freelancerSkillsWithExp = $this->getFreelancerSkills($freelancer);

        // Skills matching (70% weight) - Primary factor with experience weighting
        $skillsScore = $this->calculateSkillsMatchWithExperience(
            $job->required_skills, 
            $freelancerSkillsWithExp
        );
        $score += $skillsScore * 0.7;

        // Experience level matching (30% weight) - Secondary factor
        $experienceScore = $this->calculateExperienceMatchFromSkills($job->experience_level, $freelancerSkillsWithExp);
        $score += $experienceScore * 0.3;

        // Remove all other factors (budget, location, reputation, availability)
        // Focus only on skills and experience level

        return min($score, $maxScore);
    }

    /**
     * Calculate skills matching score WITH experience level weighting
     */
    private function calculateSkillsMatchWithExperience(array $requiredSkills, array $freelancerSkillsWithExp): float
    {
        if (empty($requiredSkills) || empty($freelancerSkillsWithExp)) {
            return 0.0;
        }

        // Normalize required skills
        $requiredSkills = array_map(function($skill) {
            return strtolower(trim($skill));
        }, $requiredSkills);

        // Extract just the skill names from freelancer skills
        $freelancerSkillNames = array_column($freelancerSkillsWithExp, 'skill');

        // Direct matches with experience weighting
        $directMatchScore = 0;
        $directMatchCount = 0;
        
        foreach ($requiredSkills as $required) {
            foreach ($freelancerSkillsWithExp as $fSkill) {
                if ($fSkill['skill'] === $required) {
                    // Apply experience level weight
                    $directMatchScore += $fSkill['weight'];
                    $directMatchCount++;
                    break;
                }
            }
        }

        // Normalize direct match score
        $maxPossibleScore = count($requiredSkills) * 2.0; // Max weight is 2.0 for expert
        $normalizedDirectScore = $directMatchCount > 0 ? ($directMatchScore / $maxPossibleScore) : 0;

        // Partial matches (for similar skills) with reduced weight
        $partialMatches = 0;
        $partialScore = 0;
        
        foreach ($requiredSkills as $required) {
            $foundDirect = false;
            foreach ($freelancerSkillsWithExp as $fSkill) {
                if ($fSkill['skill'] === $required) {
                    $foundDirect = true;
                    break;
                }
            }
            
            if (!$foundDirect) {
                foreach ($freelancerSkillsWithExp as $fSkill) {
                    if (str_contains($fSkill['skill'], $required) || str_contains($required, $fSkill['skill'])) {
                        $partialMatches++;
                        $partialScore += $fSkill['weight'] * 0.5; // Partial matches worth 50%
                        break;
                    }
                }
            }
        }

        $normalizedPartialScore = $partialMatches > 0 ? ($partialScore / $maxPossibleScore) : 0;
        
        // Combine scores
        $totalMatchScore = $normalizedDirectScore + $normalizedPartialScore;

        // Bonus for having more skills than required (up to 20%)
        $extraSkillsBonus = min(0.2, (count($freelancerSkillsWithExp) - count($requiredSkills)) * 0.02);

        return min(1.0, $totalMatchScore + $extraSkillsBonus);
    }

    /**
     * Calculate skills matching score (legacy method for backward compatibility)
     */
    private function calculateSkillsMatch(array $requiredSkills, array $freelancerSkills): float
    {
        if (empty($requiredSkills) || empty($freelancerSkills)) {
            return 0.0;
        }

        // Normalize skills for better matching
        $requiredSkills = array_map(function($skill) {
            return strtolower(trim($skill));
        }, $requiredSkills);

        $freelancerSkills = array_map(function($skill) {
            return strtolower(trim($skill));
        }, $freelancerSkills);

        // Direct matches
        $directMatches = array_intersect($requiredSkills, $freelancerSkills);
        $directMatchScore = count($directMatches) / count($requiredSkills);

        // Partial matches (for similar skills)
        $partialMatches = 0;
        foreach ($requiredSkills as $required) {
            if (!in_array($required, $directMatches)) {
                foreach ($freelancerSkills as $freelancer) {
                    if (str_contains($freelancer, $required) || str_contains($required, $freelancer)) {
                        $partialMatches++;
                        break;
                    }
                }
            }
        }

        $partialMatchScore = ($partialMatches * 0.5) / count($requiredSkills);
        $totalMatchScore = $directMatchScore + $partialMatchScore;

        // Bonus for having more skills than required
        $extraSkillsBonus = min(0.2, (count($freelancerSkills) - count($requiredSkills)) * 0.02);

        return min(1.0, $totalMatchScore + $extraSkillsBonus);
    }

    /**
     * Calculate experience match from skills_with_experience array
     */
    private function calculateExperienceMatchFromSkills(string $requiredLevel, array $freelancerSkillsWithExp): float
    {
        if (empty($freelancerSkillsWithExp)) {
            return 0.5; // Neutral score if no skills provided
        }

        $levelMap = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        $required = $levelMap[$requiredLevel] ?? 2;

        // Calculate average experience level from all skills
        $totalLevel = 0;
        foreach ($freelancerSkillsWithExp as $skill) {
            $totalLevel += $levelMap[$skill['experience_level']] ?? 2;
        }
        $avgLevel = $totalLevel / count($freelancerSkillsWithExp);

        // Perfect match = 1.0, one level off = 0.7, two levels off = 0.3
        $difference = abs($required - $avgLevel);
        
        if ($difference < 0.5) {
            return 1.0; // Perfect match
        } elseif ($difference < 1.5) {
            return 0.7; // Close match
        } else {
            return 0.3; // Distant match
        }
    }

    /**
     * Calculate experience level match (legacy method for backward compatibility)
     */
    private function calculateExperienceMatch(string $requiredLevel, User $freelancer): float
    {
        $levelMap = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        $required = $levelMap[$requiredLevel] ?? 2;

        // Use freelancer's set experience level if available, otherwise estimate
        if ($freelancer->experience_level) {
            $freelancerLevel = $levelMap[$freelancer->experience_level] ?? 2;
        } else {
            // Fallback: Estimate freelancer level based on completed projects and ratings
            $completedProjects = $freelancer->freelancerProjects()->where('status', 'completed')->count();
            $avgRating = $freelancer->receivedReviews()->avg('rating') ?? 3;

            $freelancerLevel = 1; // Default beginner
            if ($completedProjects >= 10 && $avgRating >= 4.5) {
                $freelancerLevel = 3; // Expert
            } elseif ($completedProjects >= 3 && $avgRating >= 4.0) {
                $freelancerLevel = 2; // Intermediate
            }
        }

        // Perfect match = 1.0, one level off = 0.7, two levels off = 0.3
        $difference = abs($required - $freelancerLevel);
        return match($difference) {
            0 => 1.0,
            1 => 0.7,
            default => 0.3
        };
    }

    /**
     * Calculate budget compatibility
     */
    private function calculateBudgetMatch(GigJob $job, User $freelancer): float
    {
        $freelancerRate = $freelancer->hourly_rate ?? 25; // Default rate
        $jobBudgetMin = $job->budget_min ?? 0;
        $jobBudgetMax = $job->budget_max ?? 1000;

        if ($job->budget_type === 'hourly') {
            // For hourly jobs, compare rates directly
            if ($freelancerRate >= $jobBudgetMin && $freelancerRate <= $jobBudgetMax) {
                return 1.0;
            } elseif ($freelancerRate < $jobBudgetMin) {
                return max(0.0, 1.0 - (($jobBudgetMin - $freelancerRate) / $jobBudgetMin));
            } else {
                return max(0.0, 1.0 - (($freelancerRate - $jobBudgetMax) / $jobBudgetMax));
            }
        } else {
            // For fixed jobs, estimate based on duration and hourly rate
            $estimatedHours = ($job->estimated_duration_days ?? 7) * 6; // 6 hours per day
            $freelancerEstimate = $freelancerRate * $estimatedHours;
            
            if ($freelancerEstimate >= $jobBudgetMin && $freelancerEstimate <= $jobBudgetMax) {
                return 1.0;
            } else {
                $midpoint = ($jobBudgetMin + $jobBudgetMax) / 2;
                $difference = abs($freelancerEstimate - $midpoint);
                return max(0.0, 1.0 - ($difference / $midpoint));
            }
        }
    }

    /**
     * Calculate location match (Lapu-Lapu City focus)
     */
    private function calculateLocationMatch(GigJob $job, User $freelancer): float
    {
        // Both in Lapu-Lapu City = perfect match
        if ($freelancer->barangay && $job->location) {
            return 1.0; // Both local
        }
        
        // Remote work preference
        if ($job->is_remote) {
            return 0.8; // Good for remote
        }
        
        return 0.5; // Neutral
    }

    /**
     * Calculate freelancer reputation score
     */
    private function calculateReputationScore(User $freelancer): float
    {
        $avgRating = $freelancer->receivedReviews()->avg('rating') ?? 3.0;
        $reviewCount = $freelancer->receivedReviews()->count();
        $completedProjects = $freelancer->freelancerProjects()->where('status', 'completed')->count();

        // Base score from rating
        $ratingScore = ($avgRating - 1) / 4; // Convert 1-5 to 0-1

        // Bonus for having reviews and completed projects
        $experienceBonus = min(0.3, ($reviewCount * 0.05) + ($completedProjects * 0.02));

        return min(1.0, $ratingScore + $experienceBonus);
    }

    /**
     * Calculate availability score
     */
    private function calculateAvailabilityScore(User $freelancer): float
    {
        $activeProjects = $freelancer->freelancerProjects()->where('status', 'active')->count();
        
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
    private function getMatchReasons(GigJob $job, User $freelancer, float $score): array
    {
        $reasons = [];

        // Try to get AI-powered explanation first
        if ($this->aiService->isAvailable()) {
            $aiExplanation = $this->getAIExplanation($job, $freelancer, $score);
            if ($aiExplanation) {
                $reasons[] = "🤖 AI Analysis: " . $aiExplanation;
            }
        }

        // Get freelancer skills with experience
        $freelancerSkillsWithExp = $this->getFreelancerSkills($freelancer);
        $freelancerSkillNames = array_column($freelancerSkillsWithExp, 'skill');

        // Skills match with details (Primary factor)
        $skillsMatch = $this->calculateSkillsMatchWithExperience($job->required_skills, $freelancerSkillsWithExp);
        $requiredSkills = array_map('strtolower', $job->required_skills);
        $matchingSkills = array_intersect($requiredSkills, $freelancerSkillNames);

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

        // Experience level details (Secondary factor) - from skills_with_experience
        $experienceMatch = $this->calculateExperienceMatchFromSkills($job->experience_level, $freelancerSkillsWithExp);
        
        if (count($freelancerSkillsWithExp) > 0) {
            // Calculate average experience level
            $levelMap = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
            $avgLevel = array_sum(array_column($freelancerSkillsWithExp, 'weight')) / count($freelancerSkillsWithExp);
            $avgLevelName = match(true) {
                $avgLevel >= 1.75 => 'expert',
                $avgLevel >= 1.25 => 'intermediate',
                default => 'beginner'
            };

            if ($experienceMatch > 0.8) {
                $reasons[] = "🎯 Perfect experience level match ({$avgLevelName} = {$job->experience_level})";
            } elseif ($experienceMatch > 0.5) {
                $reasons[] = "🎯 Good experience level match ({$avgLevelName} ≈ {$job->experience_level})";
            } else {
                $reasons[] = "📊 Average experience level: {$avgLevelName} (required: {$job->experience_level})";
            }
            
            // Show skill breakdown
            $expertCount = count(array_filter($freelancerSkillsWithExp, fn($s) => $s['experience_level'] === 'expert'));
            $intermediateCount = count(array_filter($freelancerSkillsWithExp, fn($s) => $s['experience_level'] === 'intermediate'));
            $beginnerCount = count(array_filter($freelancerSkillsWithExp, fn($s) => $s['experience_level'] === 'beginner'));
            
            if ($expertCount > 0) {
                $reasons[] = "⭐ {$expertCount} expert-level " . ($expertCount === 1 ? 'skill' : 'skills');
            }
        } else {
            $reasons[] = "📋 No skills with experience levels in profile";
        }

        // Add success prediction if AI is available
        if ($this->aiService->isAvailable()) {
            $prediction = $this->getAISuccessPrediction($job, $freelancer);
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
    private function getAIExplanation(GigJob $job, User $freelancer, float $score): ?string
    {
        $jobData = [
            'id' => $job->id,
            'title' => $job->title,
            'description' => $job->description,
            'required_skills' => $job->required_skills,
            'experience_level' => $job->experience_level,
            'budget_range' => $job->budget_min && $job->budget_max ?
                "₱{$job->budget_min} - ₱{$job->budget_max}" : 'Budget not specified'
        ];

        // Use skills_with_experience for more accurate matching
        $freelancerData = [
            'id' => $freelancer->id,
            'name' => $freelancer->first_name . ' ' . $freelancer->last_name,
            'skills_with_experience' => $freelancer->skills_with_experience ?? [],
            'bio' => $freelancer->bio
        ];

        return $this->aiService->generateMatchExplanation($jobData, $freelancerData, $score);
    }

    /**
     * Get AI-powered success prediction
     */
    private function getAISuccessPrediction(GigJob $job, User $freelancer): ?array
    {
        $jobData = [
            'id' => $job->id,
            'title' => $job->title,
            'required_skills' => $job->required_skills,
            'experience_level' => $job->experience_level,
            'budget_range' => $job->budget_min && $job->budget_max ?
                "₱{$job->budget_min} - ₱{$job->budget_max}" : 'Budget not specified'
        ];

        // Use skills_with_experience for more accurate prediction
        $freelancerData = [
            'id' => $freelancer->id,
            'name' => $freelancer->first_name . ' ' . $freelancer->last_name,
            'skills_with_experience' => $freelancer->skills_with_experience ?? []
        ];

        return $this->aiService->generateSuccessPrediction($jobData, $freelancerData);
    }

    /**
     * Get AI-powered job recommendations with explanations
     */
    public function getJobRecommendations(User $freelancer): array
    {
        $matches = $this->findMatchingJobs($freelancer, 10);
        
        return [
            'recommended_jobs' => $matches->toArray(),
            'insights' => [
                'total_matches' => $matches->count(),
                'avg_match_score' => $matches->avg('match_score'),
                'top_skills_in_demand' => $this->getTopSkillsInDemand(),
                'suggested_improvements' => $this->getSuggestedImprovements($freelancer)
            ]
        ];
    }

    /**
     * Get top skills currently in demand
     */
    private function getTopSkillsInDemand(): array
    {
        $jobs = GigJob::where('status', 'open')->get();
        $skillCounts = [];

        foreach ($jobs as $job) {
            foreach ($job->required_skills as $skill) {
                $skillCounts[strtolower($skill)] = ($skillCounts[strtolower($skill)] ?? 0) + 1;
            }
        }

        arsort($skillCounts);
        return array_slice(array_keys($skillCounts), 0, 10);
    }

    /**
     * Get suggested improvements for freelancer
     */
    private function getSuggestedImprovements(User $freelancer): array
    {
        $suggestions = [];

        $skillsCount = is_array($freelancer->skills_with_experience) ? count($freelancer->skills_with_experience) : 0;
        
        if ($skillsCount < 3) {
            $suggestions[] = "Add more skills with experience levels to your profile to increase job matches";
        }

        if (!$freelancer->bio || strlen($freelancer->bio) < 100) {
            $suggestions[] = "Write a detailed bio to attract more clients";
        }

        if (!$freelancer->hourly_rate) {
            $suggestions[] = "Set your hourly rate to appear in budget-filtered searches";
        }

        $reviewCount = $freelancer->receivedReviews()->count();
        if ($reviewCount < 5) {
            $suggestions[] = "Complete more projects to build your reputation";
        }

        // Suggest adding expert-level skills
        if ($skillsCount > 0) {
            $expertCount = count(array_filter($freelancer->skills_with_experience, fn($s) => $s['experience_level'] === 'expert'));
            if ($expertCount === 0) {
                $suggestions[] = "Upgrade some of your skills to expert level as you gain more experience";
            }
        }

        return $suggestions;
    }

    /**
     * Get AI-powered skill recommendations for freelancer
     */
    public function getAISkillRecommendations(User $freelancer): array
    {
        if (!$this->aiService->isAvailable()) {
            return [
                'success' => false,
                'recommendations' => [],
                'error' => 'AI service not available'
            ];
        }

        $freelancerData = [
            'id' => $freelancer->id,
            'name' => $freelancer->first_name . ' ' . $freelancer->last_name,
            'skills_with_experience' => $freelancer->skills_with_experience ?? [],
            'bio' => $freelancer->bio
        ];

        $marketTrends = [
            'high_demand' => $this->getTopSkillsInDemand(),
            'emerging' => [
                'AI/Machine Learning',
                'Blockchain Development',
                'Mobile App Security',
                'Voice User Interface',
                'AR/VR Development'
            ]
        ];

        return $this->aiService->generateSkillRecommendations($freelancerData, $marketTrends);
    }

    /**
     * Get AI-powered job recommendations with enhanced insights
     */
    public function getAIJobRecommendations(User $freelancer): array
    {
        $matches = $this->findMatchingJobs($freelancer, 10);

        $enhancedMatches = $matches->map(function ($match) use ($freelancer) {
            // Add AI explanation if available
            if ($this->aiService->isAvailable()) {
                $aiExplanation = $this->getAIExplanation($match['job'], $freelancer, $match['match_score']);
                $match['ai_explanation'] = $aiExplanation;

                $prediction = $this->getAISuccessPrediction($match['job'], $freelancer);
                $match['success_prediction'] = $prediction;
            }

            return $match;
        });

        return [
            'recommended_jobs' => $enhancedMatches->toArray(),
            'insights' => [
                'total_matches' => $matches->count(),
                'avg_match_score' => $matches->avg('match_score'),
                'top_skills_in_demand' => $this->getTopSkillsInDemand(),
                'suggested_improvements' => $this->getSuggestedImprovements($freelancer),
                'ai_service_available' => $this->aiService->isAvailable(),
                'ai_service_config' => $this->aiService->getConfig()
            ]
        ];
    }

    /**
     * Get AI-powered freelancer recommendations for a job
     */
    public function getAIMatchingFreelancers(GigJob $job): array
    {
        $matches = $this->findMatchingFreelancers($job, 20);

        $enhancedMatches = $matches->map(function ($match) use ($job) {
            // Add AI explanation if available
            if ($this->aiService->isAvailable()) {
                $aiExplanation = $this->getAIExplanation($job, $match['freelancer'], $match['match_score']);
                $match['ai_explanation'] = $aiExplanation;

                $prediction = $this->getAISuccessPrediction($job, $match['freelancer']);
                $match['success_prediction'] = $prediction;
            }

            return $match;
        });

        return [
            'matches' => $enhancedMatches->toArray(),
            'total_matches' => $matches->count(),
            'job' => $job,
            'ai_service_available' => $this->aiService->isAvailable(),
            'ai_service_config' => $this->aiService->getConfig()
        ];
    }
}

class SkillRecommendationStat
{
    protected function taxonomy(): array
    {
        return Cache::rememberForever('full_taxonomy', function () {
            $path = base_path('full_freelance_services_taxonomy.json');
            $json = file_exists($path) ? file_get_contents($path) : '{}';
            $data = json_decode($json, true) ?: [];
            return $data;
        });
    }

    protected function flattenTaxonomy(): array
    {
        $data = $this->taxonomy();
        $skills = [];
        $categories = [];
        foreach (($data['services'] ?? []) as $service) {
            foreach (($service['categories'] ?? []) as $cat) {
                $categories[] = [
                    'name' => $cat['name'] ?? '',
                    'skills' => $cat['skills'] ?? [],
                ];
                foreach (($cat['skills'] ?? []) as $s) {
                    $skills[$s] = true;
                }
            }
        }
        return [
            'skills' => array_keys($skills),
            'categories' => $categories,
        ];
    }

    protected function synonyms(): array
    {
        return [
            'react js' => 'react',
            'react.js' => 'react',
            'js' => 'javascript',
            'node' => 'node.js',
            'adobe premiere' => 'adobe premiere pro',
            'davinci' => 'davinci resolve',
            'ux' => 'ui/ux',
            'ui' => 'ui/ux',
            'ml' => 'machine learning',
            'ai' => 'machine learning',
            'unity3d' => 'unity',
            'c sharp' => 'c#',
            'c plus plus' => 'c++',
            'frontend' => 'web development',
            'backend' => 'web development',
            'laravel php' => 'laravel',
        ];
    }

    protected function categorySynonyms(): array
    {
        return [
            'graphic designer' => 'Graphic Design',
            'logo designer' => 'Logo Design & Branding',
            'ui designer' => 'UI/UX Design',
            'ux designer' => 'UI/UX Design',
            'ui/ux designer' => 'UI/UX Design',
            'web designer' => 'Web Design',
            'video editor' => 'Video Editing',
            '3d modeler' => '3D Modeling',
            'frontend developer' => 'Web Development',
            'backend developer' => 'Web Development',
            'full stack developer' => 'Web Development',
            'mobile developer' => 'Mobile App Development',
            'react native developer' => 'Mobile App Development',
            'flutter developer' => 'Mobile App Development',
            'unity developer' => 'Game Development',
            'software developer' => 'Software Development',
            'api developer' => 'API Integration & Automation',
            'database administrator' => 'Database Management',
            'cybersecurity analyst' => 'Cybersecurity',
            'ai engineer' => 'AI & Machine Learning',
            'seo specialist' => 'SEO',
            'social media manager' => 'Social Media Marketing',
            'content writer' => 'Article & Blog Writing',
            'technical writer' => 'Technical Writing',
            'translator' => 'Translation',
            'photographer' => 'Photography',
            'project manager' => 'Project Management',
            'accountant' => 'Accounting & Bookkeeping',
            'legal consultant' => 'Legal Consulting',
            'data analyst' => 'Data Analysis',
            'data scientist' => 'Machine Learning',
            'shopify developer' => 'E-commerce Development',
            'woocommerce developer' => 'E-commerce Development',
            'cad designer' => 'CAD Design',
            'mechanical engineer' => 'Mechanical Engineering',
            'electrical engineer' => 'Electrical Engineering',
            'civil engineer' => 'Civil Engineering',
        ];
    }

    protected function normalize(string $text): string
    {
        $t = Str::lower($text);
        $t = preg_replace('/[^a-z0-9+.# ]/i', ' ', $t);
        $t = preg_replace('/\s+/', ' ', $t);
        return trim($t);
    }

    protected function tokenize(string $text): array
    {
        return array_values(array_filter(explode(' ', $this->normalize($text))));
    }

    protected function rootify(string $word): string
    {
        $w = $word;
        $rules = [
            ['ers', 3], ['er', 2], ['ors', 3], ['or', 2],
            ['ing', 3], ['ments', 5], ['ment', 4], ['ions', 4], ['ion', 3],
            ['ists', 4], ['ist', 3], ['als', 3], ['al', 2], ['s', 1],
        ];
        foreach ($rules as [$end, $cut]) {
            if (Str::endsWith($w, $end) && Str::length($w) > $cut) {
                return Str::substr($w, 0, Str::length($w) - $cut);
            }
        }
        return $w;
    }

    protected function matchCategories(string $text, array $categoryIndex): array
    {
        $textNorm = $this->normalize($text);
        $tokensRoot = array_map(fn ($t) => $this->rootify($t), $this->tokenize($text));
        $matched = [];

        foreach ($categoryIndex as $cat) {
            $catNorm = $this->normalize($cat['name']);
            $catTokensRoot = array_map(fn ($t) => $this->rootify($t), explode(' ', $catNorm));

            if (Str::contains($textNorm, $catNorm)) {
                $matched[$cat['name']] = true;
                continue;
            }

            $overlap = count(array_intersect($catTokensRoot, $tokensRoot));
            $threshold = min(2, count($catTokensRoot));
            if ($overlap >= $threshold) {
                $matched[$cat['name']] = true;
            }
        }

        foreach ($this->categorySynonyms() as $alias => $catName) {
            if (Str::contains($textNorm, $this->normalize($alias))) {
                $matched[$catName] = true;
            }
        }

        return array_keys($matched);
    }

    public function recommend(string $title, string $description, array $exclude = []): array
    {
        $flat = $this->flattenTaxonomy();
        $categories = $flat['categories'];
        $allSkills = $flat['skills'];
        $excludeSet = collect($exclude)->map(fn ($s) => $this->normalize($s))->flip();

        $text = trim($title . ' ' . $description);
        $textNorm = $this->normalize($text);
        $tokens = $this->tokenize($text);

        // Category matches (high-priority skills)
        $matchedCategories = $this->matchCategories($text, $categories);
        $scored = [];
        foreach ($matchedCategories as $catName) {
            $cat = collect($categories)->first(fn ($c) => $c['name'] === $catName);
            if (!$cat) continue;
            foreach (($cat['skills'] ?? []) as $s) {
                if (!$excludeSet->has($this->normalize($s))) {
                    $scored[$s] = max($scored[$s] ?? 0, 5);
                }
            }
        }

        // Direct skill matching
        foreach ($allSkills as $s) {
            if ($excludeSet->has($this->normalize($s))) continue;
            $sNorm = $this->normalize($s);
            $score = 0;
            if (Str::contains($textNorm, $sNorm)) $score += 3;
            $sTokens = explode(' ', $sNorm);
            $tokenHits = count(array_intersect($sTokens, $tokens));
            if ($tokenHits >= min(2, count($sTokens))) $score += 2;
            foreach ($this->synonyms() as $key => $val) {
                $k = $this->normalize($key);
                $v = $this->normalize($val);
                if (Str::contains($textNorm, $k) && ($v === $sNorm || Str::contains($sNorm, $v))) {
                    $score += 2;
                }
            }
            if ($score > 0) {
                $scored[$s] = max($scored[$s] ?? 0, $score);
            }
        }

        // Emerging skills (simple heuristic; can be replaced with market feed)
        $emerging = $this->suggestEmergingSkills($title, $description, $excludeSet->keys()->all());

        // Innovative roles (combine category and keyword signals)
        $innovativeRoles = $this->suggestInnovativeRoles($title, $description, array_keys($scored));

        // Sort skills by score and return top N
        arsort($scored);
        $taxonomySkills = array_slice(array_keys($scored), 0, 12);

        return [
            'taxonomy_skills' => $taxonomySkills,
            'emerging_skills' => $emerging,
            'innovative_roles' => $innovativeRoles,
        ];
    }

    protected function suggestEmergingSkills(string $title, string $description, array $exclude = []): array
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

    // public function recordAcceptance(string $type, string $value, array $context = []): void
    // {
    //     SkillRecommendationStat::query()->updateOrCreate(
    //         ['type' => $type, 'value' => $value],
    //         [
    //             'accepted_count' => \DB::raw('accepted_count + 1'),
    //             'last_accepted_at' => now(),
    //             'context' => $context,
    //         ]
    //     );
    // }
}
