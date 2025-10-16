<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class IdentityVerification extends Model
{
    protected $fillable = [
        'user_id',
        'stripe_verification_session_id',
        'status',
        'verification_type',
        'verification_data',
        'document_data',
        'selfie_data',
        'liveness_check_passed',
        'fraud_detection_results',
        'client_secret',
        'verified_at',
        'expires_at',
        'failure_reason',
    ];

    protected $casts = [
        'verification_data' => 'array',
        'document_data' => 'array',
        'selfie_data' => 'array',
        'fraud_detection_results' => 'array',
        'liveness_check_passed' => 'boolean',
        'verified_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user that owns the identity verification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the verification is verified.
     */
    public function isVerified(): bool
    {
        return $this->status === 'verified';
    }

    /**
     * Check if the verification has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if the verification is pending.
     */
    public function isPending(): bool
    {
        return in_array($this->status, ['requires_input', 'requires_action', 'processing']);
    }

    /**
     * Get the verification status with human-readable format.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'requires_input' => 'Requires Input',
            'requires_action' => 'Requires Action',
            'processing' => 'Processing',
            'verified' => 'Verified',
            'canceled' => 'Canceled',
            default => 'Unknown'
        };
    }

    /**
     * Scope to get verified verifications.
     */
    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    /**
     * Scope to get pending verifications.
     */
    public function scopePending($query)
    {
        return $query->whereIn('status', ['requires_input', 'requires_action', 'processing']);
    }
}
