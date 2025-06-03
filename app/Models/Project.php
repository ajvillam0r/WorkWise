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
        'job_id',
        'client_id',
        'freelancer_id',
        'accepted_bid_id',
        'agreed_amount',
        'agreed_duration_days',
        'status',
        'started_at',
        'deadline',
        'completed_at',
        'completion_notes',
        'milestones',
        'payment_released',
    ];

    protected function casts(): array
    {
        return [
            'agreed_amount' => 'decimal:2',
            'started_at' => 'datetime',
            'deadline' => 'datetime',
            'completed_at' => 'datetime',
            'milestones' => 'array',
            'payment_released' => 'boolean',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(GigJob::class, 'job_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    public function acceptedBid(): BelongsTo
    {
        return $this->belongsTo(Bid::class, 'accepted_bid_id');
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

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
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
