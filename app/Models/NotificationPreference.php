<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'notification_type',
        'is_enabled',
        'email_enabled',
        'push_enabled'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'email_enabled' => 'boolean',
        'push_enabled' => 'boolean'
    ];

    /**
     * Get the user that owns the notification preference
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for enabled preferences
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Scope for email enabled preferences
     */
    public function scopeEmailEnabled($query)
    {
        return $query->where('email_enabled', true);
    }

    /**
     * Scope for push enabled preferences
     */
    public function scopePushEnabled($query)
    {
        return $query->where('push_enabled', true);
    }

    /**
     * Scope for specific notification type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('notification_type', $type);
    }
}
