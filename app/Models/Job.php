<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $table = 'gig_jobs';

    protected $fillable = [
        'employer_id',
        'title',
        'description',
        'required_skills',
        'budget_type',
        'budget_min',
        'budget_max',
        'experience_level',
        'estimated_duration_days',
        'status',
        'deadline',
        'location',
        'is_remote'
    ];

    protected $casts = [
        'required_skills' => 'array',
        'deadline' => 'datetime',
        'is_remote' => 'boolean'
    ];

    public function employer()
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function bids()
    {
        return $this->hasMany(Bid::class, 'job_id');
    }
}
