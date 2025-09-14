<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBehaviorAnalytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'action_type',
        'behavior_data',
        'ip_address',
        'user_agent',
        'device_fingerprint',
        'risk_score',
        'risk_factors',
        'flagged',
        'analyzed_at',
    ];

    protected $casts = [
        'behavior_data' => 'array',
        'device_fingerprint' => 'array',
        'risk_factors' => 'array',
        'risk_score' => 'decimal:2',
        'flagged' => 'boolean',
        'analyzed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the behavior analytics
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for high risk behaviors
     */
    public function scopeHighRisk($query)
    {
        return $query->where('risk_score', '>=', 0.8);
    }

    /**
     * Scope for flagged behaviors
     */
    public function scopeFlagged($query)
    {
        return $query->where('flagged', true);
    }

    /**
     * Scope for recent behaviors
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get risk level as string
     */
    public function getRiskLevelAttribute(): string
    {
        if ($this->risk_score >= 0.8) {
            return 'high';
        } elseif ($this->risk_score >= 0.6) {
            return 'medium';
        } elseif ($this->risk_score >= 0.4) {
            return 'low';
        }

        return 'minimal';
    }

    /**
     * Check if behavior is suspicious
     */
    public function isSuspicious(): bool
    {
        return $this->risk_score >= 0.6 || $this->flagged;
    }
}
