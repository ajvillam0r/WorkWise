<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class FraudDetectionCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_id',
        'user_id',
        'fraud_type',
        'description',
        'evidence_data',
        'fraud_score',
        'financial_impact',
        'status',
        'severity',
        'assigned_admin_id',
        'investigation_notes',
        'detected_at',
        'resolved_at',
        'resolution_data',
        'ip_address',
        'user_agent',
        'device_fingerprint',
        'location_data',
    ];

    protected $casts = [
        'evidence_data' => 'array',
        'fraud_score' => 'decimal:2',
        'financial_impact' => 'decimal:2',
        'investigation_notes' => 'array',
        'detected_at' => 'datetime',
        'resolved_at' => 'datetime',
        'resolution_data' => 'array',
        'user_agent' => 'array',
        'device_fingerprint' => 'array',
        'location_data' => 'array',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($case) {
            if (empty($case->case_id)) {
                $case->case_id = 'FDC-' . strtoupper(Str::random(8)) . '-' . now()->format('Ymd');
            }
            if (empty($case->detected_at)) {
                $case->detected_at = now();
            }
        });
    }

    /**
     * Get the user that owns the fraud case
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
     * Get the fraud alerts for this case
     */
    public function alerts(): HasMany
    {
        return $this->hasMany(FraudDetectionAlert::class, 'fraud_case_id');
    }

    /**
     * Scope for active cases
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['investigating', 'confirmed']);
    }

    /**
     * Scope for resolved cases
     */
    public function scopeResolved($query)
    {
        return $query->whereIn('status', ['resolved', 'false_positive']);
    }

    /**
     * Scope for high severity cases
     */
    public function scopeHighSeverity($query)
    {
        return $query->whereIn('severity', ['high', 'critical']);
    }

    /**
     * Scope for recent cases
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('detected_at', '>=', now()->subDays($days));
    }

    /**
     * Check if case is resolved
     */
    public function isResolved(): bool
    {
        return in_array($this->status, ['resolved', 'false_positive']);
    }

    /**
     * Check if case is critical
     */
    public function isCritical(): bool
    {
        return $this->severity === 'critical';
    }

    /**
     * Get risk level as string
     */
    public function getRiskLevelAttribute(): string
    {
        if ($this->fraud_score >= 90) {
            return 'critical';
        } elseif ($this->fraud_score >= 70) {
            return 'high';
        } elseif ($this->fraud_score >= 50) {
            return 'medium';
        } elseif ($this->fraud_score >= 30) {
            return 'low';
        }

        return 'minimal';
    }

    /**
     * Resolve the case
     */
    public function resolve(array $resolutionData = []): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolution_data' => $resolutionData,
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
     * Add investigation note
     */
    public function addInvestigationNote(string $note, User $admin): void
    {
        $notes = $this->investigation_notes ?? [];
        $notes[] = [
            'note' => $note,
            'admin_id' => $admin->id,
            'admin_name' => $admin->full_name,
            'timestamp' => now()->toISOString(),
        ];

        $this->update([
            'investigation_notes' => $notes,
        ]);
    }
}
