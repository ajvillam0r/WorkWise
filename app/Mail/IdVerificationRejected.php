<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class IdVerificationRejected extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $reason;
    public $isResubmission;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $reason, bool $isResubmission = false)
    {
        $this->user = $user;
        $this->reason = $reason;
        $this->isResubmission = $isResubmission;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isResubmission 
            ? 'Please Resubmit Your ID - WorkWise'
            : 'ID Verification Status - WorkWise';

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.id-verification-rejected',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
