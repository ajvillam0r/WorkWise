<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraudDetectionRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'rule_name',
        'description',
        'rule_type',
        'conditions',
        'parameters',
        'threshold_value',
        'threshold_operator',
        'time_window_minutes',
        'risk_score',
        'severity',
        'enabled',
        'priority',
        'created_by',
        'updated_by',
        'tags',
        'last_triggered_at',
        'trigger_count',
    ];

    protected $casts = [
        'conditions' => 'array',
        'parameters' => 'array',
        'threshold_value' => 'decimal:2',
        'risk_score' => 'decimal:2',
        'enabled' => 'boolean',
        'tags' => 'array',
        'last_triggered_at' => 'datetime',
    ];

    /**
     * Get the user who created the rule
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the rule
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for enabled rules
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope for high priority rules
     */
    public function scopeHighPriority($query)
    {
        return $query->where('priority', '<=', 50);
    }

    /**
     * Scope for rules by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('rule_type', $type);
    }

    /**
     * Scope for rules by severity
     */
    public function scopeBySeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Check if rule is active
     */
    public function isActive(): bool
    {
        return $this->enabled;
    }

    /**
     * Check if rule is high priority
     */
    public function isHighPriority(): bool
    {
        return $this->priority <= 50;
    }

    /**
     * Increment trigger count
     */
    public function incrementTriggerCount(): void
    {
        $this->update([
            'trigger_count' => $this->trigger_count + 1,
            'last_triggered_at' => now(),
        ]);
    }

    /**
     * Reset trigger count
     */
    public function resetTriggerCount(): void
    {
        $this->update([
            'trigger_count' => 0,
            'last_triggered_at' => null,
        ]);
    }

    /**
     * Get rule type display name
     */
    public function getTypeDisplayAttribute(): string
    {
        return match($this->rule_type) {
            'threshold' => 'Threshold Rule',
            'pattern' => 'Pattern Rule',
            'behavioral' => 'Behavioral Rule',
            'velocity' => 'Velocity Rule',
            default => ucfirst($this->rule_type)
        };
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
     * Get threshold operator display name
     */
    public function getOperatorDisplayAttribute(): string
    {
        return match($this->threshold_operator) {
            '>' => 'Greater than',
            '<' => 'Less than',
            '>=' => 'Greater than or equal',
            '<=' => 'Less than or equal',
            '==' => 'Equal to',
            '!=' => 'Not equal to',
            default => $this->threshold_operator
        };
    }

    /**
     * Evaluate rule conditions (placeholder for actual implementation)
     */
    public function evaluate(array $data): bool
    {
        // This would contain the actual rule evaluation logic
        // For now, return false as a placeholder
        return false;
    }

    /**
     * Get rule configuration as array
     */
    public function getConfigurationAttribute(): array
    {
        return [
            'name' => $this->rule_name,
            'type' => $this->rule_type,
            'conditions' => $this->conditions,
            'parameters' => $this->parameters,
            'threshold' => [
                'value' => $this->threshold_value,
                'operator' => $this->threshold_operator,
            ],
            'time_window' => $this->time_window_minutes,
            'risk_score' => $this->risk_score,
            'severity' => $this->severity,
            'priority' => $this->priority,
        ];
    }
}
