<?php

namespace App\Console\Commands;

use App\Models\Deposit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class ConfirmPendingDeposits extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'deposits:confirm-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically confirm pending deposits that have succeeded in Stripe';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Stripe::setApiKey(config('stripe.secret'));

        $pendingDeposits = Deposit::where('status', 'pending')
            ->where('created_at', '>', now()->subDays(7)) // Check deposits from last 7 days
            ->get();

        $this->info("Found {$pendingDeposits->count()} pending deposits to check");

        $confirmed = 0;
        $failed = 0;

        foreach ($pendingDeposits as $deposit) {
            try {
                $intent = PaymentIntent::retrieve($deposit->stripe_payment_intent_id);

                $this->line("Checking deposit {$deposit->id} - Stripe status: {$intent->status}");

                if ($intent->status === 'succeeded') {
                    $deposit->update([
                        'status' => 'completed',
                        'payment_method' => $intent->payment_method
                    ]);

                    // Update user's escrow balance
                    $deposit->user->increment('escrow_balance', $deposit->amount);

                    $this->info("✓ Confirmed deposit {$deposit->id} for user {$deposit->user->email}");
                    $confirmed++;

                    Log::info('Auto-confirmed deposit via command', [
                        'deposit_id' => $deposit->id,
                        'user_id' => $deposit->user_id,
                        'amount' => $deposit->amount
                    ]);
                } elseif ($intent->status === 'canceled' || $intent->status === 'payment_failed') {
                    $deposit->update(['status' => 'failed']);
                    $this->warn("✗ Marked deposit {$deposit->id} as failed (Stripe status: {$intent->status})");
                    $failed++;
                }
            } catch (ApiErrorException $e) {
                $this->error("✗ Failed to check deposit {$deposit->id}: {$e->getMessage()}");
                Log::error('Failed to auto-confirm deposit', [
                    'deposit_id' => $deposit->id,
                    'error' => $e->getMessage()
                ]);
                $failed++;
            }
        }

        $this->info("Summary: {$confirmed} confirmed, {$failed} failed");

        return Command::SUCCESS;
    }
}
