<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'country',
        'user_type',
        'profile_completed',
        'profile_status',
        'bio',
        'location',
        'phone',
        'profile_photo',
        'professional_title',
        'hourly_rate',
        'skills',
        'languages',
        'portfolio_url',
        'company_name',
        'work_type_needed',
        'budget_range',
        'project_intent',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'skills' => 'array',
            'languages' => 'array',
            'hourly_rate' => 'decimal:2',
            'profile_completed' => 'boolean',
        ];
    }

    /**
     * Get the user's full name
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get the user's name (for backward compatibility)
     */
    public function getNameAttribute(): string
    {
        return $this->getFullNameAttribute();
    }

    /**
     * Check if user is a freelancer
     */
    public function isFreelancer(): bool
    {
        return $this->user_type === 'freelancer';
    }

    /**
     * Check if user is a client
     */
    public function isClient(): bool
    {
        return $this->user_type === 'client';
    }

    /**
     * Jobs posted by this client
     */
    public function postedJobs(): HasMany
    {
        return $this->hasMany(GigJob::class, 'employer_id');
    }

    /**
     * Bids made by this freelancer
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class, 'freelancer_id');
    }
}
