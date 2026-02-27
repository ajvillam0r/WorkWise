<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    /**
     * Gig workers who have this skill
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'skill_user')
            ->withTimestamps();
    }
}
