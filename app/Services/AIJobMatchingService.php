<?php

namespace App\Services;

use App\Models\GigJob;
use App\Models\User;
use App\Models\Bid;
use Illuminate\Support\Collection;

class AIJobMatchingService
{
    /**
     * Find matching freelancers for a job using AI-like algorithm
     */
    public function findMatchingFreelancers(GigJob $job, int $limit = 10): Collection
    {
        $freelancers = User::where('user_type', 'freelancer')
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
        ->filter(fn($match) => $match['match_score'] > 0.3) // Only show good matches
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
        ->filter(fn($match) => $match['match_score'] > 0.3)
        ->sortByDesc('match_score')
        ->take($limit)
        ->values();
    }

    /**
     * Calculate match score between job and freelancer
     */
    private function calculateMatchScore(GigJob $job, User $freelancer): float
    {
        $score = 0.0;
        $maxScore = 1.0;

        // Skills matching (70% weight) - Primary factor
        $skillsScore = $this->calculateSkillsMatch($job->required_skills, $freelancer->skills ?? []);
        $score += $skillsScore * 0.7;

        // Experience level matching (30% weight) - Secondary factor
        $experienceScore = $this->calculateExperienceMatch($job->experience_level, $freelancer);
        $score += $experienceScore * 0.3;

        // Remove all other factors (budget, location, reputation, availability)
        // Focus only on skills and experience level

        return min($score, $maxScore);
    }

    /**
     * Calculate skills matching score
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
     * Calculate experience level match
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
     * Get human-readable match reasons
     */
    private function getMatchReasons(GigJob $job, User $freelancer, float $score): array
    {
        $reasons = [];

        // Skills match with details (Primary factor)
        $skillsMatch = $this->calculateSkillsMatch($job->required_skills, $freelancer->skills ?? []);
        $requiredSkills = array_map('strtolower', $job->required_skills);
        $freelancerSkills = array_map('strtolower', $freelancer->skills ?? []);
        $matchingSkills = array_intersect($requiredSkills, $freelancerSkills);

        if ($skillsMatch > 0.8) {
            $reasons[] = "Excellent skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } elseif ($skillsMatch > 0.5) {
            $reasons[] = "Good skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } elseif ($skillsMatch > 0.2) {
            $reasons[] = "Partial skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } elseif ($skillsMatch > 0) {
            $reasons[] = "Some skills match (" . count($matchingSkills) . "/" . count($requiredSkills) . " skills)";
        } else {
            $reasons[] = "No direct skills match - consider learning: " . implode(', ', array_slice($job->required_skills, 0, 3));
        }

        // Experience level details (Secondary factor)
        $experienceMatch = $this->calculateExperienceMatch($job->experience_level, $freelancer);
        if ($experienceMatch > 0.8) {
            $reasons[] = "Perfect experience level match ({$freelancer->experience_level} = {$job->experience_level})";
        } elseif ($experienceMatch > 0.5) {
            $reasons[] = "Good experience level match ({$freelancer->experience_level} ≈ {$job->experience_level})";
        } elseif ($freelancer->experience_level) {
            $reasons[] = "Experience level: {$freelancer->experience_level} (required: {$job->experience_level})";
        } else {
            $reasons[] = "Experience level not specified in your profile";
        }

        // Remove all other factors (budget, location, reputation, availability)
        // Focus only on skills and experience level

        // If no reasons found, provide basic info
        if (empty($reasons)) {
            $reasons[] = "Limited match - consider updating your skills and experience level";
        }

        return $reasons;
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

        if (!$freelancer->skills || count($freelancer->skills) < 3) {
            $suggestions[] = "Add more skills to your profile to increase job matches";
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

        return $suggestions;
    }
}
