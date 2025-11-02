<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected string $actionUrl)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Verify your email',
            'message' => 'Please verify your email to unlock all features.',
            'action_url' => $this->actionUrl,
            'action_text' => 'Verify Email',
            'severity' => 'info',
        ];
    }
}


