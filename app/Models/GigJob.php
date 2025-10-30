<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GigJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'employer_id',
        'title',
        'description',
        'project_category',
        'required_skills',
        'skills_requirements',
        'nice_to_have_skills',
        'budget_type',
        'budget_min',
        'budget_max',
        'experience_level',
        'job_complexity',
        'estimated_duration_days',
        'status',
        'deadline',
        'location',
        'is_remote',
    ];

    protected function casts(): array
    {
        return [
            'required_skills' => 'array',
            'skills_requirements' => 'array',
            'nice_to_have_skills' => 'array',
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
            'deadline' => 'datetime',
            'is_remote' => 'boolean',
        ];
    }

    /**
     * The employer who posted this job
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    /**
     * Bids for this job
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class, 'job_id');
    }

    /**
     * Get the accepted bid for this job
     */
    public function acceptedBid()
    {
        return $this->bids()->where('status', 'accepted')->first();
    }

    /**
     * Check if job is open for bidding
     */
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Projects created from this job
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'job_id');
    }

    /**
     * Get budget display string
     */
    public function getBudgetDisplayAttribute(): string
    {
        if ($this->budget_type === 'fixed') {
            if ($this->budget_min && $this->budget_max) {
                return "$" . number_format($this->budget_min, 0) . " - $" . number_format($this->budget_max, 0);
            }
            return "$" . number_format($this->budget_min ?? $this->budget_max, 0);
        }

        return "$" . number_format($this->budget_min ?? 0, 0) . "/hr - $" . number_format($this->budget_max ?? 0, 0) . "/hr";
    }
}
