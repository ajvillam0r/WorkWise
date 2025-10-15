<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerLanguage extends Model
{
    use HasFactory;

    protected $fillable = [
        'freelancer_id',
        'language',
        'proficiency_level',
        'is_native',
        'certifications',
        'display_order',
    ];

    protected $casts = [
        'is_native' => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Available proficiency levels.
     */
    public const PROFICIENCY_LEVELS = [
        'basic' => 'Basic',
        'conversational' => 'Conversational',
        'fluent' => 'Fluent',
        'native' => 'Native',
    ];

    /**
     * Get the freelancer that owns this language.
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    /**
     * Get the formatted proficiency level.
     */
    public function getFormattedProficiencyAttribute(): string
    {
        return self::PROFICIENCY_LEVELS[$this->proficiency_level] ?? ucfirst($this->proficiency_level);
    }

    /**
     * Get proficiency level with native indicator.
     */
    public function getProficiencyDisplayAttribute(): string
    {
        $proficiency = $this->formatted_proficiency;
        
        if ($this->is_native) {
            return $proficiency . ' (Native)';
        }
        
        return $proficiency;
    }

    /**
     * Get proficiency level as a numeric value for sorting.
     */
    public function getProficiencyNumericAttribute(): int
    {
        $levels = [
            'basic' => 1,
            'conversational' => 2,
            'fluent' => 3,
            'native' => 4,
        ];
        
        return $levels[$this->proficiency_level] ?? 0;
    }

    /**
     * Check if this is a high proficiency language.
     */
    public function getIsHighProficiencyAttribute(): bool
    {
        return in_array($this->proficiency_level, ['fluent', 'native']);
    }

    /**
     * Scope to get native languages.
     */
    public function scopeNative($query)
    {
        return $query->where('is_native', true);
    }

    /**
     * Scope to get high proficiency languages.
     */
    public function scopeHighProficiency($query)
    {
        return $query->whereIn('proficiency_level', ['fluent', 'native']);
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
                WHEN 'native' THEN 4 
                WHEN 'fluent' THEN 3 
                WHEN 'conversational' THEN 2 
                WHEN 'basic' THEN 1 
                ELSE 0 
            END DESC
        ");
    }

    /**
     * Scope to filter by proficiency level.
     */
    public function scopeByLevel($query, $level)
    {
        return $query->where('proficiency_level', $level);
    }

    /**
     * Scope to search by language name.
     */
    public function scopeByLanguage($query, $language)
    {
        return $query->where('language', 'like', "%{$language}%");
    }
}
