<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\GigJob;

/**
 * Helper methods for AI Recommendation Controller
 * Contains utility methods for consistent matching methodology
 */
trait AIRecommendationHelpers
{
    /**
     * Calculate skills compatibility using consistent methodology
     */
    private function calculateSkillsCompatibility(array $requiredSkills, array $gigWorkerSkills): float
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
     * Calculate experience compatibility using consistent methodology
     */
    private function calculateExperienceCompatibility(string $requiredLevel, ?string $gigWorkerLevel): float
    {
        $levelMap = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        $required = $levelMap[$requiredLevel] ?? 2;
        $gigWorkerLevelValue = $levelMap[$gigWorkerLevel ?? 'intermediate'] ?? 2;

        // Perfect match = 1.0, one level off = 0.7, two levels off = 0.3
        $difference = abs($required - $gigWorkerLevelValue);
        return match($difference) {
            0 => 1.0,
            1 => 0.7,
            default => 0.3
        };
    }

    /**
     * Calculate budget compatibility using consistent methodology
     */
    private function calculateBudgetCompatibility(GigJob $job, User $gigWorker): float
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
     * Get success likelihood description
     */
    private function getSuccessLikelihood(float $score): string
    {
        return match(true) {
            $score >= 0.8 => 'Very High',
            $score >= 0.6 => 'High',
            $score >= 0.4 => 'Moderate',
            $score >= 0.2 => 'Low',
            default => 'Very Low'
        };
    }

    /**
     * Extract insight summary from AI response
     */
    private function extractInsightSummary(string $content): string
    {
        if (preg_match('/SUMMARY:\s*(.+?)(?=\n\d+\.|$)/s', $content, $matches)) {
            return trim($matches[1]);
        }
        
        // Fallback: take first sentence
        $sentences = explode('.', $content);
        return trim($sentences[0] ?? 'AI analysis completed') . '.';
    }

    /**
     * Extract strengths from AI response
     */
    private function extractStrengths(string $content): array
    {
        if (preg_match('/STRENGTHS:\s*(.+?)(?=\n\d+\.|$)/s', $content, $matches)) {
            $strengthsText = trim($matches[1]);
            return array_filter(array_map('trim', explode('-', $strengthsText)));
        }
        
        return ['Strong skills alignment', 'Good experience match'];
    }

    /**
     * Extract considerations from AI response
     */
    private function extractConsiderations(string $content): array
    {
        if (preg_match('/CONSIDERATIONS:\s*(.+?)(?=\n\d+\.|$)/s', $content, $matches)) {
            $considerationsText = trim($matches[1]);
            return array_filter(array_map('trim', explode('-', $considerationsText)));
        }
        
        return ['Review project requirements carefully'];
    }

    /**
     * Extract recommendation from AI response
     */
    private function extractRecommendation(string $content): string
    {
        if (preg_match('/RECOMMENDATION:\s*(.+?)(?=\n\d+\.|$)/s', $content, $matches)) {
            return trim($matches[1]);
        }
        
        return 'This appears to be a good match. Consider proceeding with confidence.';
    }

    /**
     * Get portfolio highlights for a gig worker based on job requirements
     */
    private function getPortfolioHighlights(User $gigWorker, GigJob $job): array
    {
        // This would typically query portfolio items, but for now return placeholder
        return [
            'relevant_projects' => 0,
            'similar_experience' => false,
            'skill_demonstrations' => [],
        ];
    }
}