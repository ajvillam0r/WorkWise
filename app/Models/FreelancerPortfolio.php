<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerPortfolio extends Model
{
    use HasFactory;

    protected $fillable = [
        'freelancer_id',
        'title',
        'description',
        'images',
        'links',
        'technologies_used',
        'project_type',
        'completion_date',
        'client_name',
        'client_feedback',
        'project_value',
        'duration_days',
        'is_featured',
        'is_public',
        'display_order',
        'views_count',
    ];

    protected $casts = [
        'images' => 'array',
        'links' => 'array',
        'technologies_used' => 'array',
        'completion_date' => 'date',
        'project_value' => 'decimal:2',
        'duration_days' => 'integer',
        'is_featured' => 'boolean',
        'is_public' => 'boolean',
        'display_order' => 'integer',
        'views_count' => 'integer',
    ];

    /**
     * Get the freelancer that owns this portfolio item.
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    /**
     * Get the primary image for this portfolio item.
     */
    public function getPrimaryImageAttribute(): ?string
    {
        return $this->images && count($this->images) > 0 ? $this->images[0] : null;
    }

    /**
     * Get formatted project value.
     */
    public function getFormattedProjectValueAttribute(): ?string
    {
        return $this->project_value ? '$' . number_format($this->project_value, 2) : null;
    }

    /**
     * Get formatted duration.
     */
    public function getFormattedDurationAttribute(): ?string
    {
        if (!$this->duration_days) return null;
        
        if ($this->duration_days < 30) {
            return $this->duration_days . ' day' . ($this->duration_days > 1 ? 's' : '');
        } else {
            $months = round($this->duration_days / 30, 1);
            return $months . ' month' . ($months > 1 ? 's' : '');
        }
    }

    /**
     * Get the main external link.
     */
    public function getMainLinkAttribute(): ?string
    {
        return $this->links && count($this->links) > 0 ? $this->links[0] : null;
    }

    /**
     * Increment views count.
     */
    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    /**
     * Scope to get public portfolio items.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to get featured portfolio items.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('completion_date', 'desc');
    }

    /**
     * Scope to filter by project type.
     */
    public function scopeByType($query, $type)
    {
        return $query->where('project_type', $type);
    }

    /**
     * Scope to search by title or description.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }
}
