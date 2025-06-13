<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'freelancer_id',
        'job_id',
        'bid_id',
        'contract_id',
        'status',
        'started_at',
        'completed_at',
        'completion_notes',
        'client_approved',
        'approved_at',
        'payment_released',
        'payment_released_at',
        'agreed_amount',
        'platform_fee',
        'net_amount',
        'contract_signed',
        'contract_signed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'approved_at' => 'datetime',
        'payment_released_at' => 'datetime',
        'contract_signed_at' => 'datetime',
        'payment_released' => 'boolean',
        'client_approved' => 'boolean',
        'contract_signed' => 'boolean',
        'agreed_amount' => 'decimal:2',
        'platform_fee' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

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

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed' && $this->completed_at !== null;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPendingContract(): bool
    {
        return $this->status === 'pending_contract';
    }

    public function hasSignedContract(): bool
    {
        return $this->contract_signed && $this->contract_signed_at !== null;
    }

    public function isDisputed(): bool
    {
        return $this->status === 'disputed';
    }

    public function getDaysRemainingAttribute(): int
    {
        if (!$this->deadline) {
            return 0;
        }

        return max(0, now()->diffInDays($this->deadline, false));
    }

    public function getProgressPercentageAttribute(): int
    {
        if (!$this->milestones) {
            return 0;
        }

        $completed = collect($this->milestones)->where('completed', true)->count();
        $total = count($this->milestones);

        return $total > 0 ? round(($completed / $total) * 100) : 0;
    }
}
