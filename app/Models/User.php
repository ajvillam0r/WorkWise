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
        'barangay',
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
        'stripe_customer_id',
        'stripe_account_id',
        'stripe_account_details',
        'stripe_onboarded_at',
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
            'stripe_account_details' => 'array',
            'stripe_onboarded_at' => 'datetime',
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

    // Project relationships
    public function clientProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'client_id');
    }

    public function freelancerProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'freelancer_id');
    }

    // Review relationships
    public function givenReviews(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    public function receivedReviews(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewee_id');
    }

    // Message relationships
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    // Transaction relationships
    public function paymentsMade(): HasMany
    {
        return $this->hasMany(Transaction::class, 'payer_id');
    }

    public function paymentsReceived(): HasMany
    {
        return $this->hasMany(Transaction::class, 'payee_id');
    }

    // Report relationships
    public function reportsSubmitted(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function reportsReceived(): HasMany
    {
        return $this->hasMany(Report::class, 'reported_user_id');
    }

    /**
     * Get average rating for this user
     */
    public function getAverageRatingAttribute(): float
    {
        return $this->receivedReviews()->avg('rating') ?? 0.0;
    }

    /**
     * Get total earnings for freelancer
     */
    public function getTotalEarningsAttribute(): float
    {
        return $this->paymentsReceived()
            ->where('type', 'release')
            ->where('status', 'completed')
            ->sum('net_amount');
    }

    /**
     * Get completion rate for freelancer
     */
    public function getCompletionRateAttribute(): float
    {
        $totalProjects = $this->freelancerProjects()->count();
        if ($totalProjects === 0) return 0.0;

        $completedProjects = $this->freelancerProjects()
            ->where('status', 'completed')
            ->count();

        return ($completedProjects / $totalProjects) * 100;
    }
}
