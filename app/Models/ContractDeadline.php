<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractDeadline extends Model
{
    protected $fillable = [
        'contract_id',
        'milestone_name',
        'due_date',
        'status',
        'reminder_sent'
    ];

    protected $casts = [
        'due_date' => 'date',
        'reminder_sent' => 'boolean'
    ];

    /**
     * Get the contract that owns the deadline
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'contract_id');
    }

    /**
     * Scope for pending deadlines
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for overdue deadlines
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue')
                    ->where('due_date', '<', now()->toDateString());
    }

    /**
     * Scope for completed deadlines
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for upcoming deadlines (within 7 days)
     */
    public function scopeUpcoming($query, int $days = 7)
    {
        return $query->where('due_date', '<=', now()->addDays($days)->toDateString())
                    ->where('due_date', '>=', now()->toDateString())
                    ->where('status', 'pending');
    }

    /**
     * Scope for deadlines with reminders not sent
     */
    public function scopeRemindersNotSent($query)
    {
        return $query->where('reminder_sent', false);
    }

    /**
     * Mark deadline as completed
     */
    public function markCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'reminder_sent' => true
        ]);
    }

    /**
     * Mark deadline as overdue
     */
    public function markOverdue(): void
    {
        $this->update(['status' => 'overdue']);
    }

    /**
     * Mark reminder as sent
     */
    public function markReminderSent(): void
    {
        $this->update(['reminder_sent' => true]);
    }
}
