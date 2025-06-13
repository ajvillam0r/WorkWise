<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'project_id',
        'client_id',
        'freelancer_id',
        'job_id',
        'bid_id',
        'scope_of_work',
        'total_payment',
        'contract_type',
        'project_start_date',
        'project_end_date',
        'client_responsibilities',
        'freelancer_responsibilities',
        'preferred_communication',
        'communication_frequency',
        'status',
        'freelancer_signed_at',
        'client_signed_at',
        'fully_signed_at',
        'pdf_path',
        'pdf_generated_at',
    ];

    protected $attributes = [
        'status' => 'pending_client_signature',
    ];

    protected function casts(): array
    {
        return [
            'total_payment' => 'decimal:2',
            'project_start_date' => 'date',
            'project_end_date' => 'date',
            'client_responsibilities' => 'array',
            'freelancer_responsibilities' => 'array',
            'freelancer_signed_at' => 'datetime',
            'client_signed_at' => 'datetime',
            'fully_signed_at' => 'datetime',
            'pdf_generated_at' => 'datetime',
        ];
    }

    /**
     * Generate unique contract ID
     */
    public static function generateContractId(): string
    {
        $year = date('Y');
        $lastContract = self::where('contract_id', 'like', "WW-{$year}-%")
            ->orderBy('contract_id', 'desc')
            ->first();
        
        if ($lastContract) {
            $lastNumber = (int) substr($lastContract->contract_id, -6);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return sprintf('WW-%s-%06d', $year, $newNumber);
    }

    /**
     * Relationships
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(GigJob::class, 'job_id');
    }

    public function bid(): BelongsTo
    {
        return $this->belongsTo(Bid::class, 'bid_id');
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(ContractSignature::class);
    }

    /**
     * Status check methods
     */
    public function isPendingFreelancerSignature(): bool
    {
        return $this->status === 'pending_freelancer_signature';
    }

    public function isPendingClientSignature(): bool
    {
        return $this->status === 'pending_client_signature';
    }

    public function isFullySigned(): bool
    {
        return $this->status === 'fully_signed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Get signature for specific role
     */
    public function getSignatureForRole(string $role): ?ContractSignature
    {
        return $this->signatures()->where('role', $role)->first();
    }

    /**
     * Check if user has signed
     */
    public function hasUserSigned(int $userId): bool
    {
        return $this->signatures()->where('user_id', $userId)->exists();
    }

    /**
     * Get next signer (who needs to sign next)
     * Client must sign first, then freelancer
     */
    public function getNextSigner(): ?string
    {
        // If status is empty or null, default to pending client signature
        if (empty($this->status)) {
            return 'client';
        }

        // Client must sign first
        if ($this->isPendingClientSignature()) {
            return 'client';
        }

        // After client signs, freelancer can sign
        if ($this->isPendingFreelancerSignature()) {
            return 'freelancer';
        }

        return null;
    }

    /**
     * Check if user can sign this contract
     */
    public function canUserSign(int $userId): bool
    {
        \Log::info('Checking if user can sign contract', [
            'contract_id' => $this->id,
            'user_id' => $userId,
            'client_id' => $this->client_id,
            'freelancer_id' => $this->freelancer_id,
            'contract_status' => $this->status
        ]);

        // User must be either client or freelancer
        if ($userId !== $this->client_id && $userId !== $this->freelancer_id) {
            \Log::warning('User is not client or freelancer', [
                'user_id' => $userId,
                'client_id' => $this->client_id,
                'freelancer_id' => $this->freelancer_id
            ]);
            return false;
        }

        // User must not have already signed
        if ($this->hasUserSigned($userId)) {
            \Log::warning('User has already signed', [
                'user_id' => $userId,
                'contract_id' => $this->id
            ]);
            return false;
        }

        // Contract must not be fully signed or cancelled
        if ($this->isFullySigned() || $this->isCancelled()) {
            \Log::warning('Contract is fully signed or cancelled', [
                'contract_id' => $this->id,
                'is_fully_signed' => $this->isFullySigned(),
                'is_cancelled' => $this->isCancelled(),
                'status' => $this->status
            ]);
            return false;
        }

        // Check if it's the user's turn to sign based on contract status
        $userRole = $this->getUserRole($userId);
        $nextSigner = $this->getNextSigner();

        // If status is empty, default to client-first workflow
        if (empty($this->status) && $userRole === 'client') {
            return true;
        }

        if ($nextSigner && $userRole !== $nextSigner) {
            \Log::warning('Not user\'s turn to sign', [
                'user_id' => $userId,
                'user_role' => $userRole,
                'next_signer' => $nextSigner,
                'contract_status' => $this->status
            ]);
            return false;
        }

        \Log::info('User can sign contract', [
            'user_id' => $userId,
            'contract_id' => $this->id,
            'user_role' => $userRole,
            'next_signer' => $nextSigner
        ]);

        return true;
    }

    /**
     * Check if client has signed the contract
     */
    public function hasClientSigned(): bool
    {
        return $this->client_signed_at !== null;
    }

    /**
     * Check if freelancer can view/sign contract
     * Freelancer can only view/sign after client has signed
     */
    public function canFreelancerAccess(): bool
    {
        return $this->hasClientSigned();
    }

    /**
     * Get user role in this contract
     */
    public function getUserRole(int $userId): ?string
    {
        if ($userId === $this->client_id) {
            return 'client';
        }

        if ($userId === $this->freelancer_id) {
            return 'freelancer';
        }

        return null;
    }
}
