<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraudWatchlist extends Model
{
    use HasFactory;

    protected $table = 'fraud_watchlist';

    protected $fillable = [
        'user_id',
        'added_by',
        'reason',
    ];

    /**
     * Get the user on the watchlist
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who added the user
     */
    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    /**
     * Check if a user is on the watchlist
     */
    public static function isOnWatchlist(int $userId): bool
    {
        return static::where('user_id', $userId)->exists();
    }
}
