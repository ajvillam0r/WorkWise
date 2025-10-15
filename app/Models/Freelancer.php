<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Freelancer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'professional_title',
        'bio',
        'hourly_rate',
        'availability_status',
        'profile_photo',
        'cover_photo',
        'location',
        'timezone',
        'phone',
        'website',
        'linkedin_url',
        'github_url',
        'portfolio_url',
        'years_of_experience',
        'response_time_hours',
        'profile_completion_percentage',
        'is_profile_public',
        'is_available_for_work',
        'preferred_project_size',
        'preferred_project_duration',
        'minimum_project_budget',
        'languages_spoken',
        'certifications_count',
        'portfolio_items_count',
        'total_earnings',
        'available_balance',
        'pending_earnings',
        'average_rating',
        'total_reviews',
        'total_projects_completed',
        'success_rate',
        'on_time_delivery_rate',
        'repeat_client_rate',
        'last_active_at',
        'profile_views_count',
        'profile_views_this_month',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'available_balance' => 'decimal:2',
        'pending_earnings' => 'decimal:2',
        'minimum_project_budget' => 'decimal:2',
        'average_rating' => 'decimal:2',
        'success_rate' => 'decimal:2',
        'on_time_delivery_rate' => 'decimal:2',
        'repeat_client_rate' => 'decimal:2',
        'profile_completion_percentage' => 'integer',
        'years_of_experience' => 'integer',
        'response_time_hours' => 'integer',
        'certifications_count' => 'integer',
        'portfolio_items_count' => 'integer',
        'total_reviews' => 'integer',
        'total_projects_completed' => 'integer',
        'profile_views_count' => 'integer',
        'profile_views_this_month' => 'integer',
        'is_profile_public' => 'boolean',
        'is_available_for_work' => 'boolean',
        'languages_spoken' => 'array',
        'last_active_at' => 'datetime',
    ];

    protected $dates = [
        'last_active_at',
        'deleted_at',
    ];

    /**
     * Relationship to User model
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Freelancer experiences
     */
    public function experiences(): HasMany
    {
        return $this->hasMany(FreelancerExperience::class);
    }

    /**
     * Freelancer education
     */
    public function educations(): HasMany
    {
        return $this->hasMany(FreelancerEducation::class);
    }

    /**
     * Freelancer portfolio items
     */
    public function portfolios(): HasMany
    {
        return $this->hasMany(FreelancerPortfolio::class);
    }

    /**
     * Freelancer certifications
     */
    public function certifications(): HasMany
    {
        return $this->hasMany(FreelancerCertification::class);
    }

    /**
     * Freelancer languages
     */
    public function languages(): HasMany
    {
        return $this->hasMany(FreelancerLanguage::class);
    }

    /**
     * Freelancer skills (many-to-many)
     */
    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'freelancer_skills')
                    ->withPivot('proficiency_level', 'years_of_experience')
                    ->withTimestamps();
    }

    /**
     * Reviews received by this freelancer
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(FreelancerReview::class);
    }

    /**
     * Earnings records
     */
    public function earnings(): HasMany
    {
        return $this->hasMany(FreelancerEarning::class);
    }

    /**
     * Projects completed by this freelancer
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'gig_worker_id', 'user_id');
    }

    /**
     * Bids made by this freelancer
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class, 'gig_worker_id', 'user_id');
    }

    /**
     * Scopes
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available_for_work', true)
                    ->where('availability_status', 'available');
    }

    public function scopePublic($query)
    {
        return $query->where('is_profile_public', true);
    }

    public function scopeHighRated($query, $minRating = 4.0)
    {
        return $query->where('average_rating', '>=', $minRating);
    }

    public function scopeExperienced($query, $minProjects = 5)
    {
        return $query->where('total_projects_completed', '>=', $minProjects);
    }

    /**
     * Accessors
     */
    public function getFullNameAttribute(): string
    {
        return $this->user->first_name . ' ' . $this->user->last_name;
    }

    public function getDisplayNameAttribute(): string
    {
        // For privacy, show first name + last initial for public view
        return $this->user->first_name . ' ' . substr($this->user->last_name, 0, 1) . '.';
    }

    public function getProfilePhotoUrlAttribute(): string
    {
        return $this->profile_photo 
            ? asset('storage/' . $this->profile_photo)
            : asset('images/default-avatar.png');
    }

    public function getCoverPhotoUrlAttribute(): string
    {
        return $this->cover_photo 
            ? asset('storage/' . $this->cover_photo)
            : asset('images/default-cover.jpg');
    }

    public function getExperienceLevelAttribute(): string
    {
        if ($this->years_of_experience >= 5) {
            return 'Expert';
        } elseif ($this->years_of_experience >= 2) {
            return 'Intermediate';
        } else {
            return 'Beginner';
        }
    }

    public function getResponseTimeTextAttribute(): string
    {
        if ($this->response_time_hours <= 1) {
            return 'Within 1 hour';
        } elseif ($this->response_time_hours <= 6) {
            return 'Within 6 hours';
        } elseif ($this->response_time_hours <= 24) {
            return 'Within 24 hours';
        } else {
            return 'More than 24 hours';
        }
    }

    /**
     * Calculate profile completion percentage
     */
    public function calculateProfileCompletion(): int
    {
        $fields = [
            'professional_title' => 10,
            'bio' => 15,
            'hourly_rate' => 10,
            'profile_photo' => 10,
            'location' => 5,
            'phone' => 5,
        ];

        $relationshipPoints = [
            'experiences' => 15,
            'educations' => 10,
            'portfolios' => 15,
            'skills' => 10,
            'certifications' => 5,
        ];

        $score = 0;

        // Check basic fields
        foreach ($fields as $field => $points) {
            if (!empty($this->$field)) {
                $score += $points;
            }
        }

        // Check relationships
        foreach ($relationshipPoints as $relation => $points) {
            if ($this->$relation()->count() > 0) {
                $score += $points;
            }
        }

        return min(100, $score);
    }

    /**
     * Update profile completion percentage
     */
    public function updateProfileCompletion(): void
    {
        $this->update([
            'profile_completion_percentage' => $this->calculateProfileCompletion()
        ]);
    }

    /**
     * Check if freelancer is available for new projects
     */
    public function isAvailableForWork(): bool
    {
        return $this->is_available_for_work && 
               $this->availability_status === 'available' &&
               $this->is_profile_public;
    }

    /**
     * Get top skills (most proficient)
     */
    public function getTopSkills($limit = 5)
    {
        return $this->skills()
                   ->orderByPivot('proficiency_level', 'desc')
                   ->orderByPivot('years_of_experience', 'desc')
                   ->limit($limit)
                   ->get();
    }

    /**
     * Get recent portfolio items
     */
    public function getRecentPortfolio($limit = 3)
    {
        return $this->portfolios()
                   ->latest()
                   ->limit($limit)
                   ->get();
    }

    /**
     * Get recent reviews
     */
    public function getRecentReviews($limit = 5)
    {
        return $this->reviews()
                   ->with('employer')
                   ->latest()
                   ->limit($limit)
                   ->get();
    }
}