<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($skill) {
            if (empty($skill->slug)) {
                $skill->slug = Str::slug($skill->name);
            }
        });

        static::updating(function ($skill) {
            if ($skill->isDirty('name') && empty($skill->slug)) {
                $skill->slug = Str::slug($skill->name);
            }
        });
    }

    /**
     * Get freelancer skills that use this skill.
     */
    public function freelancerSkills(): HasMany
    {
        return $this->hasMany(FreelancerSkill::class);
    }

    /**
     * Get freelancers that have this skill.
     */
    public function freelancers()
    {
        return $this->belongsToMany(Freelancer::class, 'freelancer_skills')
                    ->withPivot('proficiency_level', 'years_of_experience', 'is_featured')
                    ->withTimestamps();
    }

    /**
     * Scope to get active skills only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by usage count.
     */
    public function scopePopular($query)
    {
        return $query->orderBy('usage_count', 'desc');
    }

    /**
     * Scope to filter by category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Increment usage count when a freelancer adds this skill.
     */
    public function incrementUsage()
    {
        $this->increment('usage_count');
    }

    /**
     * Decrement usage count when a freelancer removes this skill.
     */
    public function decrementUsage()
    {
        $this->decrement('usage_count');
    }

    /**
     * Get or create a skill by name.
     */
    public static function findOrCreateByName(string $name): self
    {
        return static::firstOrCreate(
            ['name' => trim($name)],
            ['slug' => Str::slug(trim($name))]
        );
    }
}