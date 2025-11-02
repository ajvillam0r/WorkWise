<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Mail\Mailer;
use Illuminate\Support\Facades\Log;

class MailException extends Exception
{
    /**
     * Report the exception
     */
    public function report(): void
    {
        Log::error('Mail Exception', [
            'message' => $this->message,
            'code' => $this->code,
            'trace' => $this->getTraceAsString(),
        ]);
    }

    /**
     * Create a new MailException for connection failures
     */
    public static function connectionFailed(string $host, string $originalError): self
    {
        $message = "Failed to connect to mail server '{$host}'. {$originalError}";
        return new self($message);
    }

    /**
     * Create a new MailException for send failures
     */
    public static function sendFailed(string $recipient, string $originalError): self
    {
        $message = "Failed to send email to '{$recipient}'. {$originalError}";
        return new self($message);
    }

    /**
     * Create a new MailException for configuration issues
     */
    public static function configurationError(string $issue): self
    {
        $message = "Mail configuration error: {$issue}";
        return new self($message);
    }
}
