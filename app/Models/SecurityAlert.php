<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'alert_type',
        'risk_score',
        'alert_data',
        'status',
        'severity',
        'description',
        'recommended_actions',
        'resolved_at',
    ];

    protected $casts = [
        'alert_data' => 'array',
        'recommended_actions' => 'array',
        'risk_score' => 'decimal:2',
        'resolved_at' => 'datetime',
    ];

    /**
     * Get the user that owns the security alert
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for pending alerts
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for high severity alerts
     */
    public function scopeHighSeverity($query)
    {
        return $query->whereIn('severity', ['high', 'critical']);
    }

    /**
     * Scope for unresolved alerts
     */
    public function scopeUnresolved($query)
    {
        return $query->whereIn('status', ['pending', 'investigating']);
    }

    /**
     * Mark alert as resolved
     */
    public function resolve(): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);
    }

    /**
     * Mark alert as false positive
     */
    public function markAsFalsePositive(): void
    {
        $this->update([
            'status' => 'false_positive',
            'resolved_at' => now(),
        ]);
    }

    /**
     * Check if alert is critical
     */
    public function isCritical(): bool
    {
        return $this->severity === 'critical';
    }

    /**
     * Check if alert is resolved
     */
    public function isResolved(): bool
    {
        return in_array($this->status, ['resolved', 'false_positive']);
    }
}
