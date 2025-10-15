<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerEducation extends Model
{
    use HasFactory;

    protected $table = 'freelancer_educations';

    protected $fillable = [
        'freelancer_id',
        'institution_name',
        'degree_type',
        'field_of_study',
        'description',
        'start_date',
        'end_date',
        'is_current',
        'gpa',
        'location',
        'activities_and_societies',
        'display_order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'gpa' => 'decimal:2',
        'display_order' => 'integer',
    ];

    /**
     * Get the freelancer that owns this education.
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    /**
     * Get the duration of this education in years.
     */
    public function getDurationInYearsAttribute(): float
    {
        $endDate = $this->is_current ? now() : $this->end_date;
        return round($this->start_date->diffInYears($endDate, true), 1);
    }

    /**
     * Get formatted duration string.
     */
    public function getFormattedDurationAttribute(): string
    {
        $years = $this->getDurationInYearsAttribute();
        
        if ($years >= 1) {
            return $years . ' year' . ($years > 1 ? 's' : '');
        } else {
            $months = $this->start_date->diffInMonths($this->is_current ? now() : $this->end_date);
            return $months . ' month' . ($months > 1 ? 's' : '');
        }
    }

    /**
     * Get formatted GPA display.
     */
    public function getFormattedGpaAttribute(): ?string
    {
        return $this->gpa ? number_format($this->gpa, 2) . '/4.00' : null;
    }

    /**
     * Scope to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('start_date', 'desc');
    }

    /**
     * Scope to get current education.
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    /**
     * Scope to filter by degree type.
     */
    public function scopeByDegreeType($query, $degreeType)
    {
        return $query->where('degree_type', $degreeType);
    }
}
