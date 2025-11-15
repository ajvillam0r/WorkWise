<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'password',
        'user_type',
        'profile_completed',
        'profile_status',
        'bio',
        'phone',
        'profile_photo',
        'profile_picture',
        'professional_title',
        'hourly_rate',
        'company_name',
        'work_type_needed',
        'budget_range',
        'project_intent',
        // Enhanced employer fields
        'company_size',
        'industry',
        'company_website',
        'company_description',
        'primary_hiring_needs',
        'typical_project_budget',
        'typical_project_duration',
        'preferred_experience_level',
        'hiring_frequency',
        'business_registration_document',
        'tax_id',
        'stripe_customer_id',
        'stripe_account_id',
        'stripe_account_details',
        'stripe_onboarded_at',
        'escrow_balance',
        'is_admin',
        'google_id',
        'avatar',
        // Enhanced gig worker fields
        'broad_category',
        'specific_services',
        'skills_with_experience',
        'working_hours',
        'timezone',
        'preferred_communication',
        'availability_notes',
        'id_type',
        'id_front_image',
        'id_back_image',
        'id_verification_status',
        'id_verification_notes',
        'id_verified_at',
        'tutorial_completed',
        'onboarding_step',
        // Location hierarchy fields
        'country',
        'city',
        'street_address',
        'postal_code',
        'address_verified_at',
        // Portfolio fields
        'portfolio_link',
        'resume_file',
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
     * Get profile picture URL with fallback
     * Returns profile_picture if set, otherwise profile_photo
     */
    public function getProfilePictureUrlAttribute(): ?string
    {
        return $this->profile_picture ?? $this->profile_photo ?? $this->avatar;
    }

    /**
     * Set profile picture and sync with profile_photo for backward compatibility
     */
    public function setProfilePictureAttribute($value): void
    {
        $this->attributes['profile_picture'] = $value;
        // Sync to profile_photo for backward compatibility
        if ($value) {
            $this->attributes['profile_photo'] = $value;
        }
    }

    /**
     * Set profile photo and sync with profile_picture for forward compatibility
     */
    public function setProfilePhotoAttribute($value): void
    {
        $this->attributes['profile_photo'] = $value;
        // Sync to profile_picture for forward compatibility
        if ($value) {
            $this->attributes['profile_picture'] = $value;
        }
    }

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
            'hourly_rate' => 'decimal:2',
            'profile_completed' => 'boolean',
            'stripe_account_details' => 'array',
            'stripe_onboarded_at' => 'datetime',
            'escrow_balance' => 'decimal:2',
            'is_admin' => 'boolean',
            'specific_services' => 'array',
            'skills_with_experience' => 'array',
            'working_hours' => 'array',
            'preferred_communication' => 'array',
            'primary_hiring_needs' => 'array',
            'id_verified_at' => 'datetime',
            'tutorial_completed' => 'boolean',
            'onboarding_step' => 'integer',
            'address_verified_at' => 'datetime',
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
     * Get just the skill names from skills_with_experience
     * Returns array of skill names for matching purposes
     */
    public function getSkillsAttribute(): array
    {
        if (empty($this->skills_with_experience)) {
            return [];
        }

        // Extract skill names from skills_with_experience array
        return array_map(function($skillData) {
            return is_array($skillData) ? ($skillData['skill'] ?? $skillData['name'] ?? '') : $skillData;
        }, $this->skills_with_experience);
    }

    /**
     * Check if user is an employer
     */
    public function isEmployer(): bool
    {
        return $this->user_type === 'employer';
    }

    /**
     * Check if user is a client (deprecated - use isEmployer)
     */
    public function isClient(): bool
    {
        return $this->user_type === 'client';
    }

    /**
     * Check if user is a gig worker
     */
    public function isGigWorker(): bool
    {
        return $this->user_type === 'gig_worker';
    }

    /**
     * Check if user is a freelancer (deprecated - use isGigWorker)
     */
    public function isFreelancer(): bool
    {
        return $this->user_type === 'gig_worker';
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->is_admin || $this->user_type === 'admin';
    }

    /**
     * Jobs posted by this employer
     */
    public function postedJobs(): HasMany
    {
        return $this->hasMany(GigJob::class, 'employer_id');
    }

    /**
     * Bids made by this gig worker
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class, 'gig_worker_id');
    }

    // Project relationships
    public function employerProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'employer_id');
    }

    public function gigWorkerProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'gig_worker_id');
    }

    /**
     * Get client projects (deprecated - use employerProjects)
     */
    public function clientProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'employer_id');
    }

    /**
     * Get freelancer projects (deprecated - use gigWorkerProjects)
     */
    public function freelancerProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'gig_worker_id');
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
     * Get total earnings for gig worker
     */
    public function getTotalEarningsAttribute(): float
    {
        return $this->paymentsReceived()
            ->where('type', 'release')
            ->where('status', 'completed')
            ->sum('net_amount');
    }

    /**
     * Get completion rate for gig worker
     */
    public function getCompletionRateAttribute(): float
    {
        $totalProjects = $this->gigWorkerProjects()->count();
        if ($totalProjects === 0) return 0.0;

        $completedProjects = $this->gigWorkerProjects()
            ->where('status', 'completed')
            ->count();

        return ($completedProjects / $totalProjects) * 100;
    }

    /**
     * Get the user's deposits
     */
    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    /**
     * Get the user's portfolio items
     */
    public function portfolioItems(): HasMany
    {
        return $this->hasMany(PortfolioItem::class)->orderBy('display_order');
    }

    /**
     * Get job templates created by this employer
     */
    public function jobTemplates(): HasMany
    {
        return $this->hasMany(JobTemplate::class, 'employer_id');
    }

    /**
     * Check if user's address is verified
     */
    public function isAddressVerified(): bool
    {
        return $this->address_verified_at !== null;
    }

    /**
     * Check if user has completed ID verification
     * Returns true only if both ID images are uploaded AND status is verified
     * 
     * Note: PHP function names are case-insensitive, so this replaces the old isIdVerified() method
     */
    public function isIDVerified(): bool
    {
        return !empty($this->id_front_image) && 
               !empty($this->id_back_image) && 
               $this->id_verification_status === 'verified';
    }

    /**
     * Check if user has uploaded ID documents (pending verification)
     * Returns true if both front and back images are uploaded, regardless of verification status
     */
    public function hasIDDocuments(): bool
    {
        return !empty($this->id_front_image) && !empty($this->id_back_image);
    }

    /**
     * Check if user has portfolio link or resume
     */
    public function hasPortfolio(): bool
    {
        return !empty($this->portfolio_link) || !empty($this->resume_file);
    }
}
