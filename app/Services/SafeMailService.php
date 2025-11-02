<?php

namespace App\Services;

use App\Exceptions\MailException;
use Exception;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportException;

class SafeMailService
{
    /**
     * Configuration check results
     */
    protected array $configStatus = [];

    /**
     * Send mail safely with error handling
     */
    public function send(Mailable $mailable, ?string $recipient = null): bool
    {
        try {
            // Check configuration first
            if (!$this->isConfigurationValid()) {
                Log::warning('Mail configuration invalid', $this->configStatus);
                return false;
            }

            // Attempt to send
            Mail::send($mailable);

            Log::info('Email sent successfully', [
                'recipient' => $recipient ?? 'system',
                'timestamp' => now(),
            ]);

            return true;

        } catch (TransportException $e) {
            return $this->handleTransportError($e, $recipient);
        } catch (Exception $e) {
            return $this->handleGeneralError($e, $recipient);
        }
    }

    /**
     * Handle transport/connection errors
     */
    protected function handleTransportError(TransportException $e, ?string $recipient): bool
    {
        $errorMessage = $e->getMessage();

        // Log the error with details
        Log::error('Mail Transport Error', [
            'error' => $errorMessage,
            'recipient' => $recipient,
            'host' => config('mail.mailers.smtp.host'),
            'port' => config('mail.mailers.smtp.port'),
            'timestamp' => now(),
        ]);

        // Check for specific error types
        if (strpos($errorMessage, 'getaddrinfo') !== false) {
            Log::error('DNS resolution failed for SMTP host', [
                'host' => config('mail.mailers.smtp.host'),
                'check' => 'The mail server host cannot be resolved. Check your MAIL_HOST configuration.',
            ]);
        } elseif (strpos($errorMessage, 'Connection refused') !== false) {
            Log::error('SMTP connection refused', [
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'check' => 'The mail server is not accepting connections. Check MAIL_PORT.',
            ]);
        } elseif (strpos($errorMessage, 'Authentication failed') !== false) {
            Log::error('SMTP authentication failed', [
                'username' => config('mail.mailers.smtp.username'),
                'check' => 'Check your MAIL_USERNAME and MAIL_PASSWORD.',
            ]);
        }

        return false;
    }

    /**
     * Handle general errors
     */
    protected function handleGeneralError(Exception $e, ?string $recipient): bool
    {
        Log::error('Mail Sending Error', [
            'error' => $e->getMessage(),
            'recipient' => $recipient,
            'code' => $e->getCode(),
            'trace' => $e->getTraceAsString(),
        ]);

        return false;
    }

    /**
     * Validate mail configuration
     */
    public function isConfigurationValid(): bool
    {
        $this->configStatus = [];

        // Check MAIL_DRIVER
        $driver = config('mail.driver');
        if (!$driver) {
            $this->configStatus['driver'] = 'MAIL_DRIVER is not set';
            return false;
        }

        // Check SMTP configuration if using SMTP
        if ($driver === 'smtp') {
            if (!$this->validateSmtpConfig()) {
                return false;
            }
        }

        // Check FROM address
        if (!config('mail.from.address')) {
            $this->configStatus['from'] = 'MAIL_FROM_ADDRESS is not set';
            return false;
        }

        return true;
    }

    /**
     * Validate SMTP specific configuration
     */
    protected function validateSmtpConfig(): bool
    {
        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');
        $username = config('mail.mailers.smtp.username');
        $password = config('mail.mailers.smtp.password');

        if (!$host) {
            $this->configStatus['smtp_host'] = 'MAIL_HOST is not set';
            return false;
        }

        if (!$port) {
            $this->configStatus['smtp_port'] = 'MAIL_PORT is not set (default: 587)';
            return false;
        }

        if (!$username || !$password) {
            $this->configStatus['smtp_auth'] = 'MAIL_USERNAME or MAIL_PASSWORD is not set';
            return false;
        }

        return true;
    }

    /**
     * Get configuration status
     */
    public function getConfigStatus(): array
    {
        return $this->configStatus;
    }

    /**
     * Check if mail service is operational
     */
    public function isOperational(): bool
    {
        return $this->isConfigurationValid();
    }

    /**
     * Get mail configuration details for debugging
     */
    public function getConfigDetails(): array
    {
        return [
            'driver' => config('mail.driver'),
            'host' => config('mail.mailers.smtp.host') ?? 'not set',
            'port' => config('mail.mailers.smtp.port') ?? 'not set',
            'from_address' => config('mail.from.address') ?? 'not set',
            'from_name' => config('mail.from.name') ?? 'not set',
            'encryption' => config('mail.mailers.smtp.encryption') ?? 'tls',
        ];
    }
}
