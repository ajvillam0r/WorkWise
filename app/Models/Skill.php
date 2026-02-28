<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'source', 'promoted_at'];

    protected function casts(): array
    {
        return [
            'promoted_at' => 'datetime',
        ];
    }

    /**
     * Users who have this skill (via skill_user pivot).
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'skill_user')
            ->withTimestamps();
    }

    /**
     * Scope: only verified / promoted skills (global suggestion list).
     */
    public function scopeVerified($query)
    {
        return $query->where(function ($q) {
            $q->where('source', 'taxonomy')
              ->orWhereNotNull('promoted_at');
        });
    }

    /**
     * Scope: user-added skills that have NOT been promoted yet.
     */
    public function scopeUnverified($query)
    {
        return $query->where('source', 'user')
                     ->whereNull('promoted_at');
    }

    /**
     * Whether this skill appears in the global suggestion list.
     */
    public function isVerified(): bool
    {
        return $this->source === 'taxonomy' || $this->promoted_at !== null;
    }
}
