<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Services\PaymentService;

class TestPaymentRelease extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:payment-flow';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the complete payment flow from bid acceptance to payment release';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Payment Release Functionality...');

        // Get all projects
        $projects = Project::with(['freelancer', 'client', 'job', 'transactions'])->get();

        $this->info('Found ' . $projects->count() . ' projects:');

        foreach ($projects as $project) {
            $this->info("Project ID: {$project->id}");
            $this->info("Job: {$project->job->title}");
            $this->info("Freelancer: {$project->freelancer->first_name} {$project->freelancer->last_name}");
            $this->info("Status: {$project->status}");
            $this->info("Client Approved: " . ($project->client_approved ? 'Yes' : 'No'));
            $this->info("Payment Released: " . ($project->payment_released ? 'Yes' : 'No'));
            $this->info("Net Amount: ₱{$project->net_amount}");

            // Show transactions
            $this->info("Transactions:");
            foreach ($project->transactions as $transaction) {
                $this->info("  - Type: {$transaction->type}, Status: {$transaction->status}, Amount: ₱{$transaction->net_amount}");
            }

            // Test payment release if not already released
            if ($project->status === 'completed' && !$project->payment_released) {
                $this->info("Testing payment release for this project...");

                $paymentService = app(PaymentService::class);
                $result = $paymentService->releasePayment($project);

                $this->info("Payment release result: " . json_encode($result));

                // Refresh project to see changes
                $project->refresh();
                $this->info("After release - Payment Released: " . ($project->payment_released ? 'Yes' : 'No'));
            }

            $this->info("---");
        }

        // Now test the wallet calculation for each freelancer
        $this->info('Testing Freelancer Wallet Calculations...');

        $freelancers = \App\Models\User::where('user_type', 'freelancer')->get();

        foreach ($freelancers as $freelancer) {
            $this->info("Freelancer: {$freelancer->first_name} {$freelancer->last_name}");

            // Get completed projects with payment released
            $completedProjects = Project::where('freelancer_id', $freelancer->id)
                ->where('status', 'completed')
                ->where('payment_released', true)
                ->get();

            // Get pending payments
            $pendingPayments = Project::where('freelancer_id', $freelancer->id)
                ->where('status', 'completed')
                ->where('payment_released', false)
                ->get();

            $totalEarnings = $completedProjects->sum('net_amount');
            $pendingEarnings = $pendingPayments->sum('net_amount');

            $this->info("  Total Earnings (Available): ₱{$totalEarnings}");
            $this->info("  Pending Earnings: ₱{$pendingEarnings}");
            $this->info("  Completed Projects: {$completedProjects->count()}");
            $this->info("  Pending Projects: {$pendingPayments->count()}");
            $this->info("---");
        }

        $this->info('Test completed!');
    }
}
