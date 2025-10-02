<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class FraudDetectionAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'alert_id',
        'user_id',
        'alert_type',
        'rule_name',
        'fraud_case_id',
        'alert_message',
        'alert_data',
        'risk_score',
        'severity',
        'status',
        'assigned_admin_id',
        'triggered_at',
        'acknowledged_at',
        'resolved_at',
        'resolution_notes',
        'notified',
        'notification_channels',
        'ip_address',
        'user_agent',
        'context_data',
    ];

    protected $casts = [
        'alert_data' => 'array',
        'risk_score' => 'decimal:2',
        'resolution_notes' => 'array',
        'triggered_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
        'notified' => 'boolean',
        'notification_channels' => 'array',
        'user_agent' => 'array',
        'context_data' => 'array',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($alert) {
            if (empty($alert->alert_id)) {
                $alert->alert_id = 'ALT-' . strtoupper(Str::random(8)) . '-' . now()->format('YmdHis');
            }
            if (empty($alert->triggered_at)) {
                $alert->triggered_at = now();
            }
        });
    }

    /**
     * Get the user that triggered the alert
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the assigned admin
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }

    /**
     * Get the fraud case this alert belongs to
     */
    public function fraudCase(): BelongsTo
    {
        return $this->belongsTo(FraudDetectionCase::class, 'fraud_case_id');
    }

    /**
     * Scope for active alerts
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for acknowledged alerts
     */
    public function scopeAcknowledged($query)
    {
        return $query->where('status', 'acknowledged');
    }

    /**
     * Scope for resolved alerts
     */
    public function scopeResolved($query)
    {
        return $query->whereIn('status', ['resolved', 'false_positive']);
    }

    /**
     * Scope for high severity alerts
     */
    public function scopeHighSeverity($query)
    {
        return $query->whereIn('severity', ['high', 'critical']);
    }

    /**
     * Scope for recent alerts
     */
    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('triggered_at', '>=', now()->subHours($hours));
    }

    /**
     * Check if alert is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if alert is critical
     */
    public function isCritical(): bool
    {
        return $this->severity === 'critical';
    }

    /**
     * Check if alert has been acknowledged
     */
    public function isAcknowledged(): bool
    {
        return $this->status === 'acknowledged';
    }

    /**
     * Check if alert is resolved
     */
    public function isResolved(): bool
    {
        return in_array($this->status, ['resolved', 'false_positive']);
    }

    /**
     * Acknowledge the alert
     */
    public function acknowledge(User $admin): void
    {
        $this->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
            'assigned_admin_id' => $admin->id,
        ]);
    }

    /**
     * Resolve the alert
     */
    public function resolve(array $resolutionNotes = []): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolution_notes' => $resolutionNotes,
        ]);
    }

    /**
     * Mark as false positive
     */
    public function markAsFalsePositive(): void
    {
        $this->update([
            'status' => 'false_positive',
            'resolved_at' => now(),
        ]);
    }

    /**
     * Mark as notified
     */
    public function markAsNotified(array $channels = []): void
    {
        $this->update([
            'notified' => true,
            'notification_channels' => $channels,
        ]);
    }

    /**
     * Get severity display name
     */
    public function getSeverityDisplayAttribute(): string
    {
        return match($this->severity) {
            'low' => 'Low',
            'medium' => 'Medium',
            'high' => 'High',
            'critical' => 'Critical',
            default => ucfirst($this->severity)
        };
    }

    /**
     * Get status display name
     */
    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'active' => 'Active',
            'acknowledged' => 'Acknowledged',
            'resolved' => 'Resolved',
            'false_positive' => 'False Positive',
            default => ucfirst(str_replace('_', ' ', $this->status))
        };
    }

    /**
     * Get alert type display name
     */
    public function getAlertTypeDisplayAttribute(): string
    {
        return match($this->alert_type) {
            'rule_triggered' => 'Rule Triggered',
            'manual_flag' => 'Manual Flag',
            'system_detected' => 'System Detected',
            default => ucfirst(str_replace('_', ' ', $this->alert_type))
        };
    }

    /**
     * Get risk level as string
     */
    public function getRiskLevelAttribute(): string
    {
        if ($this->risk_score >= 90) {
            return 'critical';
        } elseif ($this->risk_score >= 70) {
            return 'high';
        } elseif ($this->risk_score >= 50) {
            return 'medium';
        } elseif ($this->risk_score >= 30) {
            return 'low';
        }

        return 'minimal';
    }
}
