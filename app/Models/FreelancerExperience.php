<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerExperience extends Model
{
    use HasFactory;

    protected $fillable = [
        'freelancer_id',
        'company_name',
        'job_title',
        'description',
        'start_date',
        'end_date',
        'is_current',
        'location',
        'employment_type',
        'skills_used',
        'achievements',
        'display_order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'skills_used' => 'array',
        'display_order' => 'integer',
    ];

    /**
     * Get the freelancer that owns this experience.
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    /**
     * Get the duration of this experience in months.
     */
    public function getDurationInMonthsAttribute(): int
    {
        $endDate = $this->is_current ? now() : $this->end_date;
        return $this->start_date->diffInMonths($endDate);
    }

    /**
     * Get formatted duration string.
     */
    public function getFormattedDurationAttribute(): string
    {
        $months = $this->getDurationInMonthsAttribute();
        $years = intval($months / 12);
        $remainingMonths = $months % 12;

        if ($years > 0 && $remainingMonths > 0) {
            return "{$years} year" . ($years > 1 ? 's' : '') . " {$remainingMonths} month" . ($remainingMonths > 1 ? 's' : '');
        } elseif ($years > 0) {
            return "{$years} year" . ($years > 1 ? 's' : '');
        } else {
            return "{$remainingMonths} month" . ($remainingMonths > 1 ? 's' : '');
        }
    }

    /**
     * Scope to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('start_date', 'desc');
    }

    /**
     * Scope to get current positions.
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }
}
