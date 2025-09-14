<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserTypingPattern extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'avg_typing_speed',
        'keystroke_dynamics',
        'pause_patterns',
        'common_typos',
        'device_type',
        'sample_count',
        'last_updated',
    ];

    protected $casts = [
        'keystroke_dynamics' => 'array',
        'pause_patterns' => 'array',
        'common_typos' => 'array',
        'last_updated' => 'datetime',
    ];

    /**
     * Get the user that owns the typing pattern
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if pattern has enough samples for reliable analysis
     */
    public function hasReliableData(): bool
    {
        return $this->sample_count >= 5;
    }

    /**
     * Get typing speed category
     */
    public function getSpeedCategoryAttribute(): string
    {
        if ($this->avg_typing_speed >= 60) {
            return 'fast';
        } elseif ($this->avg_typing_speed >= 40) {
            return 'average';
        } elseif ($this->avg_typing_speed >= 20) {
            return 'slow';
        }

        return 'very_slow';
    }

    /**
     * Compare with another typing pattern
     */
    public function compareWith(array $newTypingData): float
    {
        $newSpeed = $newTypingData['speed'] ?? 0;
        $speedDifference = abs($this->avg_typing_speed - $newSpeed) / max($this->avg_typing_speed, 1);

        // Return similarity score (0 = completely different, 1 = identical)
        return 1 - min(1, $speedDifference);
    }
}
