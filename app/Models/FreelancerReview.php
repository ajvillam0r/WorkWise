<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class FreelancerReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'freelancer_id',
        'employer_id',
        'project_id',
        'rating',
        'communication_rating',
        'quality_rating',
        'timeliness_rating',
        'professionalism_rating',
        'review_text',
        'private_feedback',
        'skills_rated',
        'is_public',
        'is_featured',
        'is_verified',
        'freelancer_response',
        'freelancer_response_at',
    ];

    protected $casts = [
        'rating' => 'decimal:2',
        'communication_rating' => 'decimal:2',
        'quality_rating' => 'decimal:2',
        'timeliness_rating' => 'decimal:2',
        'professionalism_rating' => 'decimal:2',
        'skills_rated' => 'array',
        'is_public' => 'boolean',
        'is_featured' => 'boolean',
        'is_verified' => 'boolean',
        'freelancer_response_at' => 'datetime',
    ];

    /**
     * Get the freelancer that owns this review.
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    /**
     * Get the employer who wrote this review.
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    /**
     * Get the project this review is for.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Check if the freelancer has responded to this review.
     */
    public function getHasResponseAttribute(): bool
    {
        return !empty($this->freelancer_response);
    }

    /**
     * Get the average of all rating categories.
     */
    public function getAverageRatingAttribute(): float
    {
        $ratings = array_filter([
            $this->communication_rating,
            $this->quality_rating,
            $this->timeliness_rating,
            $this->professionalism_rating,
        ]);

        return count($ratings) > 0 ? round(array_sum($ratings) / count($ratings), 2) : $this->rating;
    }

    /**
     * Get formatted review date.
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->created_at->format('M j, Y');
    }

    /**
     * Get time since review was posted.
     */
    public function getTimeAgoAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    /**
     * Scope to get public reviews.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to get featured reviews.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to get verified reviews.
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope to get reviews with responses.
     */
    public function scopeWithResponse($query)
    {
        return $query->whereNotNull('freelancer_response');
    }

    /**
     * Scope to get reviews by rating range.
     */
    public function scopeByRating($query, $minRating = null, $maxRating = null)
    {
        if ($minRating) {
            $query->where('rating', '>=', $minRating);
        }
        if ($maxRating) {
            $query->where('rating', '<=', $maxRating);
        }
        return $query;
    }

    /**
     * Scope to order by rating (highest first).
     */
    public function scopeHighestRated($query)
    {
        return $query->orderBy('rating', 'desc');
    }

    /**
     * Scope to order by most recent.
     */
    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Add a response from the freelancer.
     */
    public function addResponse(string $response): void
    {
        $this->update([
            'freelancer_response' => $response,
            'freelancer_response_at' => now(),
        ]);
    }

    /**
     * Mark review as featured.
     */
    public function markAsFeatured(): void
    {
        $this->update(['is_featured' => true]);
    }

    /**
     * Mark review as verified.
     */
    public function markAsVerified(): void
    {
        $this->update(['is_verified' => true]);
    }

    /**
     * Get star rating display (for UI).
     */
    public function getStarRatingAttribute(): array
    {
        $rating = $this->rating;
        $fullStars = floor($rating);
        $hasHalfStar = ($rating - $fullStars) >= 0.5;
        $emptyStars = 5 - $fullStars - ($hasHalfStar ? 1 : 0);

        return [
            'full' => $fullStars,
            'half' => $hasHalfStar ? 1 : 0,
            'empty' => $emptyStars,
            'rating' => $rating,
        ];
    }
}