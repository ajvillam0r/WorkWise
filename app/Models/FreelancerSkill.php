<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerSkill extends Model
{
    use HasFactory;

    protected $fillable = [
        'freelancer_id',
        'skill_id',
        'proficiency_level',
        'years_of_experience',
        'description',
        'is_featured',
        'hourly_rate',
        'projects_completed',
        'average_rating',
        'last_used',
        'display_order',
    ];

    protected $casts = [
        'years_of_experience' => 'integer',
        'is_featured' => 'boolean',
        'hourly_rate' => 'decimal:2',
        'projects_completed' => 'integer',
        'average_rating' => 'decimal:2',
        'last_used' => 'date',
        'display_order' => 'integer',
    ];

    /**
     * Available proficiency levels.
     */
    public const PROFICIENCY_LEVELS = [
        'beginner' => 'Beginner',
        'intermediate' => 'Intermediate',
        'advanced' => 'Advanced',
        'expert' => 'Expert',
    ];

    /**
     * Get the freelancer that owns this skill.
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    /**
     * Get the skill details.
     */
    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    /**
     * Get the formatted proficiency level.
     */
    public function getFormattedProficiencyAttribute(): string
    {
        return self::PROFICIENCY_LEVELS[$this->proficiency_level] ?? ucfirst($this->proficiency_level);
    }

    /**
     * Get proficiency level as a numeric value for sorting.
     */
    public function getProficiencyNumericAttribute(): int
    {
        $levels = [
            'beginner' => 1,
            'intermediate' => 2,
            'advanced' => 3,
            'expert' => 4,
        ];
        
        return $levels[$this->proficiency_level] ?? 0;
    }

    /**
     * Get experience level based on years.
     */
    public function getExperienceLevelAttribute(): string
    {
        if ($this->years_of_experience >= 10) {
            return 'Senior';
        } elseif ($this->years_of_experience >= 5) {
            return 'Mid-level';
        } elseif ($this->years_of_experience >= 2) {
            return 'Junior';
        } else {
            return 'Entry-level';
        }
    }

    /**
     * Check if skill is recently used (within last year).
     */
    public function getIsRecentlyUsedAttribute(): bool
    {
        if (!$this->last_used) {
            return false;
        }
        
        return $this->last_used->diffInMonths(now()) <= 12;
    }

    /**
     * Check if skill is highly rated.
     */
    public function getIsHighlyRatedAttribute(): bool
    {
        return $this->average_rating && $this->average_rating >= 4.5;
    }

    /**
     * Get formatted hourly rate.
     */
    public function getFormattedHourlyRateAttribute(): string
    {
        if (!$this->hourly_rate) {
            return 'Rate not set';
        }
        
        return '$' . number_format($this->hourly_rate, 2) . '/hr';
    }

    /**
     * Get skill summary for display.
     */
    public function getSummaryAttribute(): string
    {
        $parts = [];
        
        if ($this->years_of_experience) {
            $parts[] = $this->years_of_experience . ' years';
        }
        
        if ($this->projects_completed) {
            $parts[] = $this->projects_completed . ' projects';
        }
        
        if ($this->average_rating) {
            $parts[] = number_format($this->average_rating, 1) . '★';
        }
        
        return implode(' • ', $parts);
    }

    /**
     * Scope to get featured skills.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to get highly rated skills.
     */
    public function scopeHighlyRated($query)
    {
        return $query->where('average_rating', '>=', 4.5);
    }

    /**
     * Scope to get recently used skills.
     */
    public function scopeRecentlyUsed($query)
    {
        return $query->where('last_used', '>=', now()->subYear());
    }

    /**
     * Scope to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('proficiency_level', 'desc');
    }

    /**
     * Scope to order by proficiency level (highest first).
     */
    public function scopeByProficiency($query)
    {
        return $query->orderByRaw("
            CASE proficiency_level 
                WHEN 'expert' THEN 4 
                WHEN 'advanced' THEN 3 
                WHEN 'intermediate' THEN 2 
                WHEN 'beginner' THEN 1 
                ELSE 0 
            END DESC
        ");
    }

    /**
     * Scope to order by experience (most experienced first).
     */
    public function scopeByExperience($query)
    {
        return $query->orderBy('years_of_experience', 'desc');
    }

    /**
     * Scope to order by rating (highest first).
     */
    public function scopeByRating($query)
    {
        return $query->orderBy('average_rating', 'desc');
    }

    /**
     * Scope to filter by proficiency level.
     */
    public function scopeByLevel($query, $level)
    {
        return $query->where('proficiency_level', $level);
    }

    /**
     * Scope to filter by minimum years of experience.
     */
    public function scopeMinExperience($query, $years)
    {
        return $query->where('years_of_experience', '>=', $years);
    }

    /**
     * Scope to filter by hourly rate range.
     */
    public function scopeByRateRange($query, $minRate = null, $maxRate = null)
    {
        if ($minRate) {
            $query->where('hourly_rate', '>=', $minRate);
        }
        
        if ($maxRate) {
            $query->where('hourly_rate', '<=', $maxRate);
        }
        
        return $query;
    }
}
