<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class IdVerificationRejected extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(protected ?string $reason = null)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $message = 'Your ID verification was not approved.';
        
        if ($this->reason) {
            $message .= ' Reason: ' . $this->reason;
        }
        
        $message .= ' Please re-upload your documents.';
        
        return [
            'type' => 'id_verification_rejected',
            'title' => 'ID Verification Rejected',
            'message' => $message,
            'action_url' => route('id-verification.show'),
            'action_text' => 'Re-upload ID',
            'icon' => 'x-circle',
            'color' => 'red'
        ];
    }
}
