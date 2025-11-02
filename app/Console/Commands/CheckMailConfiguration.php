<?php

namespace App\Console\Commands;

use App\Services\SafeMailService;
use Illuminate\Console\Command;

class CheckMailConfiguration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check mail configuration and diagnose issues';

    /**
     * Execute the console command.
     */
    public function handle(SafeMailService $mailService): int
    {
        $this->info('🔍 Mail Configuration Checker');
        $this->newLine();

        // Display current configuration
        $this->displayConfiguration($mailService);

        // Check if operational
        if ($mailService->isOperational()) {
            $this->info('✅ Mail configuration is valid');
            return Command::SUCCESS;
        } else {
            $this->error('❌ Mail configuration has issues:');
            $this->displayConfigStatus($mailService->getConfigStatus());
            $this->newLine();
            $this->displayTroubleshooting();
            return Command::FAILURE;
        }
    }

    /**
     * Display current mail configuration
     */
    protected function displayConfiguration(SafeMailService $mailService): void
    {
        $this->info('📧 Current Mail Configuration:');
        
        $details = $mailService->getConfigDetails();
        foreach ($details as $key => $value) {
            // Mask sensitive values
            if (in_array($key, ['username', 'password'])) {
                $value = str_repeat('*', strlen($value ?? ''));
            }
            
            $this->line("  • " . ucfirst(str_replace('_', ' ', $key)) . ": " . ($value ?? 'not set'));
        }
        
        $this->newLine();
    }

    /**
     * Display configuration issues
     */
    protected function displayConfigStatus(array $status): void
    {
        foreach ($status as $issue => $message) {
            $this->line("  ❌ {$issue}: {$message}");
        }
    }

    /**
     * Display troubleshooting guide
     */
    protected function displayTroubleshooting(): void
    {
        $this->info('🔧 Troubleshooting Guide:');
        $this->newLine();

        $this->line('<fg=yellow>For Mailtrap Configuration:</> (https://mailtrap.io)');
        $this->line('  1. Log in to Mailtrap.io');
        $this->line('  2. Select your project and go to "Email Testing" > "Integrations"');
        $this->line('  3. Choose "Laravel" from the list');
        $this->line('  4. Copy the .env configuration');
        $this->newLine();

        $this->line('<fg=yellow>Required .env Variables:</>' );
        $this->line('  MAIL_DRIVER=smtp');
        $this->line('  MAIL_HOST=sandbox.smtp.mailtrap.io');
        $this->line('  MAIL_PORT=2525  (or 465 for TLS, 587 for STARTTLS)');
        $this->line('  MAIL_USERNAME=your_mailtrap_username');
        $this->line('  MAIL_PASSWORD=your_mailtrap_password');
        $this->line('  MAIL_ENCRYPTION=tls');
        $this->line('  MAIL_FROM_ADDRESS=noreply@workwise.app');
        $this->line('  MAIL_FROM_NAME="WorkWise"');
        $this->newLine();

        $this->line('<fg=yellow>Steps to Fix:</>' );
        $this->line('  1. Update your .env file with correct credentials');
        $this->line('  2. Run: php artisan config:cache');
        $this->line('  3. Run: php artisan mail:check (this command) to verify');
        $this->newLine();

        $this->line('<fg=yellow>Common Issues:</>');
        $this->line('  • DNS Resolution Failed: Check MAIL_HOST spelling and network connection');
        $this->line('  • Connection Refused: Check MAIL_PORT (2525, 465, or 587)');
        $this->line('  • Authentication Failed: Check MAIL_USERNAME and MAIL_PASSWORD');
        $this->line('  • Missing Configuration: Check all required .env variables are set');
        $this->newLine();

        $this->line('<fg=yellow>Alternative Options:</>');
        $this->line('  • Use log driver for development: MAIL_DRIVER=log');
        $this->line('  • Use Sendmail: MAIL_DRIVER=sendmail');
        $this->line('  • Use Mailgun API: MAIL_DRIVER=mailgun');
        $this->line('  • Use AWS SES: MAIL_DRIVER=ses');
    }
}
