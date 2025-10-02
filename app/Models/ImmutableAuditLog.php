<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ImmutableAuditLog extends Model
{
    use HasFactory;

    protected $table = 'immutable_audit_logs';

    protected $fillable = [
        'log_id',
        'table_name',
        'action',
        'record_id',
        'user_id',
        'user_type',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
        'session_id',
        'hash_signature',
        'previous_hash',
        'logged_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'user_agent' => 'array',
        'logged_at' => 'datetime',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($log) {
            if (empty($log->log_id)) {
                $log->log_id = 'LOG-' . strtoupper(Str::random(12)) . '-' . now()->format('YmdHis');
            }
            if (empty($log->logged_at)) {
                $log->logged_at = now();
            }
            if (empty($log->hash_signature)) {
                $log->hash_signature = $log->generateHashSignature();
            }
        });
    }

    /**
     * Get the user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate cryptographic hash signature for the log entry
     */
    public function generateHashSignature(): string
    {
        $data = [
            'log_id' => $this->log_id,
            'table_name' => $this->table_name,
            'action' => $this->action,
            'record_id' => $this->record_id,
            'user_id' => $this->user_id,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'logged_at' => $this->logged_at?->toISOString(),
            'previous_hash' => $this->previous_hash,
        ];

        // Create a string representation of the data
        $dataString = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // Add the previous hash to create blockchain-like integrity
        if ($this->previous_hash) {
            $dataString .= $this->previous_hash;
        }

        // Generate SHA-256 hash
        return hash('sha256', $dataString);
    }

    /**
     * Verify the integrity of this log entry
     */
    public function verifyIntegrity(): bool
    {
        $expectedHash = $this->generateHashSignature();
        return hash_equals($expectedHash, $this->hash_signature);
    }

    /**
     * Get the previous log entry for blockchain integrity
     */
    public static function getLastLog(): ?self
    {
        return static::latest('id')->first();
    }

    /**
     * Create a new audit log entry
     */
    public static function createLog(
        string $tableName,
        string $action,
        int $recordId,
        ?int $userId,
        string $userType,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?string $ipAddress = null,
        ?array $userAgent = null,
        ?string $sessionId = null
    ): self {
        $lastLog = static::getLastLog();
        $previousHash = $lastLog?->hash_signature;

        return static::create([
            'table_name' => $tableName,
            'action' => $action,
            'record_id' => $recordId,
            'user_id' => $userId,
            'user_type' => $userType,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'session_id' => $sessionId,
            'previous_hash' => $previousHash,
        ]);
    }

    /**
     * Scope for recent logs
     */
    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('logged_at', '>=', now()->subHours($hours));
    }

    /**
     * Scope for user actions
     */
    public function scopeUserActions($query)
    {
        return $query->where('user_type', 'user');
    }

    /**
     * Scope for admin actions
     */
    public function scopeAdminActions($query)
    {
        return $query->where('user_type', 'admin');
    }

    /**
     * Scope for system actions
     */
    public function scopeSystemActions($query)
    {
        return $query->where('user_type', 'system');
    }

    /**
     * Get formatted action description
     */
    public function getActionDescriptionAttribute(): string
    {
        return match($this->action) {
            'CREATE' => 'Created',
            'UPDATE' => 'Updated',
            'DELETE' => 'Deleted',
            default => ucfirst(strtolower($this->action))
        };
    }

    /**
     * Check if log entry has been tampered with
     */
    public function isTampered(): bool
    {
        return !$this->verifyIntegrity();
    }

    /**
     * Get changes made in this log entry
     */
    public function getChangesAttribute(): array
    {
        if ($this->action === 'CREATE') {
            return $this->new_values ?? [];
        }

        if ($this->action === 'DELETE') {
            return $this->old_values ?? [];
        }

        if ($this->action === 'UPDATE' && $this->old_values && $this->new_values) {
            $changes = [];
            foreach ($this->new_values as $key => $newValue) {
                $oldValue = $this->old_values[$key] ?? null;
                if ($oldValue !== $newValue) {
                    $changes[$key] = [
                        'old' => $oldValue,
                        'new' => $newValue,
                    ];
                }
            }
            return $changes;
        }

        return [];
    }
}
