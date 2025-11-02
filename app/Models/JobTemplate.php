<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'employer_id',
        'template_name',
        'description',
        'is_favorite',
        'title_template',
        'description_template',
        'project_category',
        'skills_requirements',
        'nice_to_have_skills',
        'budget_type',
        'typical_budget_min',
        'typical_budget_max',
        'typical_duration',
        'estimated_duration_days',
        'experience_level',
        'job_complexity',
        'location',
        'is_remote',
        'times_used',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'skills_requirements' => 'array',
            'nice_to_have_skills' => 'array',
            'typical_budget_min' => 'decimal:2',
            'typical_budget_max' => 'decimal:2',
            'is_favorite' => 'boolean',
            'is_remote' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }

    /**
     * The employer who owns this template
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    /**
     * Create a new job from this template
     */
    public function createJob(): GigJob
    {
        $job = GigJob::create([
            'employer_id' => $this->employer_id,
            'title' => $this->title_template,
            'description' => $this->description_template,
            'project_category' => $this->project_category,
            'skills_requirements' => $this->skills_requirements,
            'nice_to_have_skills' => $this->nice_to_have_skills,
            'budget_type' => $this->budget_type,
            'budget_min' => $this->typical_budget_min,
            'budget_max' => $this->typical_budget_max,
            'experience_level' => $this->experience_level,
            'job_complexity' => $this->job_complexity,
            'estimated_duration_days' => $this->estimated_duration_days,
            'location' => $this->location,
            'is_remote' => $this->is_remote,
            'status' => 'open',
        ]);

        // Update template usage
        $this->increment('times_used');
        $this->update(['last_used_at' => now()]);

        return $job;
    }

    /**
     * Get budget display string
     */
    public function getBudgetDisplayAttribute(): string
    {
        if ($this->budget_type === 'fixed') {
            if ($this->typical_budget_min && $this->typical_budget_max) {
                return "$" . number_format($this->typical_budget_min, 0) . " - $" . number_format($this->typical_budget_max, 0);
            }
            return "$" . number_format($this->typical_budget_min ?? $this->typical_budget_max, 0);
        }

        return "$" . number_format($this->typical_budget_min ?? 0, 0) . "/hr - $" . number_format($this->typical_budget_max ?? 0, 0) . "/hr";
    }
}
