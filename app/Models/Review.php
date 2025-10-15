<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'reviewer_id',
        'reviewee_id',
        'rating',
        'comment',
        'criteria_ratings',
        'is_public',
        'review_title',
        'reviewer_type',
        'reviewee_type',
        'is_visible',
        'visibility_deadline',
        'mutual_review_completed',
        'made_public_at',
        'gig_worker_reply',
        'replied_at',
        'review_metadata',
        'is_featured',
        'helpfulness_score',
    ];

    protected function casts(): array
    {
        return [
            'criteria_ratings' => 'array',
            'is_public' => 'boolean',
            'is_visible' => 'boolean',
            'mutual_review_completed' => 'boolean',
            'is_featured' => 'boolean',
            'visibility_deadline' => 'datetime',
            'made_public_at' => 'datetime',
            'replied_at' => 'datetime',
            'review_metadata' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function reviewee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewee_id');
    }

    public function getStarsDisplayAttribute(): string
    {
        return str_repeat('★', $this->rating) . str_repeat('☆', 5 - $this->rating);
    }

    public function isPositive(): bool
    {
        return $this->rating >= 4;
    }

    public function isNegative(): bool
    {
        return $this->rating <= 2;
    }

    // Two-way review system methods
    public function isPubliclyVisible(): bool
    {
        return $this->is_visible && ($this->mutual_review_completed || $this->made_public_at !== null);
    }

    public function canBePublished(): bool
    {
        return $this->visibility_deadline && now()->isAfter($this->visibility_deadline);
    }

    public function getCounterpartReview()
    {
        return self::where('project_id', $this->project_id)
            ->where('reviewer_id', $this->reviewee_id)
            ->where('reviewee_id', $this->reviewer_id)
            ->first();
    }

    public function hasCounterpartReview(): bool
    {
        return $this->getCounterpartReview() !== null;
    }

    public function makePublic(): void
    {
        $this->update([
            'is_visible' => true,
            'made_public_at' => now(),
        ]);
    }

    public function markMutualReviewCompleted(): void
    {
        $counterpart = $this->getCounterpartReview();
        
        $this->update(['mutual_review_completed' => true]);
        
        if ($counterpart) {
            $counterpart->update(['mutual_review_completed' => true]);
        }
    }

    public function canReply(): bool
    {
        return $this->reviewee_type === 'gig_worker' && 
               $this->isPubliclyVisible() && 
               empty($this->gig_worker_reply);
    }

    public function addReply(string $reply): void
    {
        if ($this->canReply()) {
            $this->update([
                'gig_worker_reply' => $reply,
                'replied_at' => now(),
            ]);
        }
    }

    public function hasReply(): bool
    {
        return !empty($this->gig_worker_reply);
    }

    // Scopes for querying
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true)
                    ->where(function ($q) {
                        $q->where('mutual_review_completed', true)
                          ->orWhereNotNull('made_public_at');
                    });
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('reviewee_id', $userId);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('reviewer_id', $userId);
    }

    public function scopeForProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopePendingVisibility($query)
    {
        return $query->where('is_visible', false)
                    ->where('mutual_review_completed', false)
                    ->whereNotNull('visibility_deadline')
                    ->where('visibility_deadline', '<=', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // Accessor for formatted review display
    public function getFormattedReviewAttribute(): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'stars_display' => $this->stars_display,
            'title' => $this->review_title,
            'comment' => $this->comment,
            'reviewer_name' => $this->reviewer->first_name . ' ' . $this->reviewer->last_name,
            'reviewer_location' => $this->reviewer->location ?? 'Location not specified',
            'project_name' => $this->project->title ?? 'Project title not available',
            'completion_date' => $this->created_at->format('M d, Y'),
            'has_reply' => $this->hasReply(),
            'reply' => $this->gig_worker_reply,
            'replied_at' => $this->replied_at ? $this->replied_at->format('M d, Y') : null,
            'is_positive' => $this->isPositive(),
            'is_negative' => $this->isNegative(),
        ];
    }
}
