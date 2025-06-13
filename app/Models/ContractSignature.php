<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractSignature extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'user_id',
        'full_name',
        'role',
        'ip_address',
        'user_agent',
        'signed_at',
        'contract_version_hash',
        'browser_info',
        'device_type',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
            'browser_info' => 'array',
        ];
    }

    /**
     * Relationships
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create signature with metadata
     */
    public static function createSignature(
        Contract $contract,
        User $user,
        string $fullName,
        string $role,
        array $metadata = []
    ): self {
        return self::create([
            'contract_id' => $contract->id,
            'user_id' => $user->id,
            'full_name' => $fullName,
            'role' => $role,
            'ip_address' => $metadata['ip_address'] ?? request()->ip(),
            'user_agent' => $metadata['user_agent'] ?? request()->userAgent(),
            'signed_at' => now(),
            'contract_version_hash' => $metadata['contract_version_hash'] ?? null,
            'browser_info' => $metadata['browser_info'] ?? null,
            'device_type' => $metadata['device_type'] ?? self::detectDeviceType(),
        ]);
    }

    /**
     * Detect device type from user agent
     */
    private static function detectDeviceType(): string
    {
        $userAgent = request()->userAgent();
        
        if (preg_match('/Mobile|Android|iPhone|iPad/', $userAgent)) {
            return 'mobile';
        }
        
        if (preg_match('/Tablet|iPad/', $userAgent)) {
            return 'tablet';
        }
        
        return 'desktop';
    }

    /**
     * Get formatted signature display
     */
    public function getFormattedSignatureAttribute(): string
    {
        return $this->full_name;
    }

    /**
     * Check if signature is valid
     */
    public function isValid(): bool
    {
        return !empty($this->full_name) && 
               !empty($this->ip_address) && 
               $this->signed_at !== null;
    }
}
