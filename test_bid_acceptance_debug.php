<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== BID ACCEPTANCE DEBUG TEST ===\n\n";

try {
    // Find a pending bid
    $bid = App\Models\Bid::where('status', 'pending')
        ->with(['job.employer', 'freelancer'])
        ->first();

    if (!$bid) {
        echo "No pending bids found. Creating test data...\n";
        
        // Create test data if needed
        $client = App\Models\User::where('role', 'client')->first();
        $freelancer = App\Models\User::where('role', 'freelancer')->first();
        
        if (!$client || !$freelancer) {
            echo "Missing test users. Please ensure you have both client and freelancer users.\n";
            exit;
        }
        
        // Create a test job
        $job = App\Models\GigJob::create([
            'title' => 'Test Job for Debugging',
            'description' => 'This is a test job for debugging bid acceptance',
            'budget_min' => 1000,
            'budget_max' => 5000,
            'required_skills' => json_encode(['PHP', 'Laravel']),
            'employer_id' => $client->id,
            'status' => 'open',
            'deadline' => now()->addDays(30)
        ]);
        
        // Create a test bid
        $bid = App\Models\Bid::create([
            'job_id' => $job->id,
            'freelancer_id' => $freelancer->id,
            'bid_amount' => 3000,
            'proposal_message' => 'Test proposal for debugging',
            'estimated_days' => 7,
            'status' => 'pending'
        ]);
        
        echo "Created test bid ID: {$bid->id}\n";
    }

    echo "Testing bid acceptance for:\n";
    echo "- Bid ID: {$bid->id}\n";
    echo "- Job: {$bid->job->title}\n";
    echo "- Client: {$bid->job->employer->first_name} {$bid->job->employer->last_name}\n";
    echo "- Freelancer: {$bid->freelancer->first_name} {$bid->freelancer->last_name}\n";
    echo "- Amount: ₱{$bid->bid_amount}\n";
    echo "- Client Balance: ₱{$bid->job->employer->escrow_balance}\n\n";

    // Ensure client has sufficient balance
    $client = $bid->job->employer;
    if ($client->escrow_balance < $bid->bid_amount) {
        echo "Adding funds to client account...\n";
        $client->increment('escrow_balance', $bid->bid_amount + 1000);
        echo "New client balance: ₱{$client->fresh()->escrow_balance}\n\n";
    }

    echo "Starting bid acceptance process...\n";

    DB::beginTransaction();

    // Step 1: Reject other bids
    echo "1. Rejecting other bids...\n";
    $rejectedCount = App\Models\Bid::where('job_id', $bid->job_id)
        ->where('id', '!=', $bid->id)
        ->update(['status' => 'rejected']);
    echo "   Rejected {$rejectedCount} other bids\n";

    // Step 2: Update job status
    echo "2. Updating job status...\n";
    $bid->job->update(['status' => 'in_progress']);
    echo "   Job status updated to: {$bid->job->fresh()->status}\n";

    // Step 3: Calculate fees
    echo "3. Calculating fees...\n";
    $platformFee = $bid->bid_amount * 0.05;
    $netAmount = $bid->bid_amount - $platformFee;
    echo "   Platform fee: ₱{$platformFee}\n";
    echo "   Net amount: ₱{$netAmount}\n";

    // Step 4: Create project
    echo "4. Creating project...\n";
    $project = App\Models\Project::create([
        'job_id' => $bid->job_id,
        'client_id' => $bid->job->employer_id,
        'freelancer_id' => $bid->freelancer_id,
        'bid_id' => $bid->id,
        'agreed_amount' => $bid->bid_amount,
        'platform_fee' => $platformFee,
        'net_amount' => $netAmount,
        'status' => 'pending_contract',
        'started_at' => null,
    ]);
    echo "   Project created: ID {$project->id}\n";

    // Step 5: Deduct from client balance
    echo "5. Deducting from client balance...\n";
    $oldBalance = $client->escrow_balance;
    $client->decrement('escrow_balance', $bid->bid_amount);
    $newBalance = $client->fresh()->escrow_balance;
    echo "   Balance: ₱{$oldBalance} → ₱{$newBalance}\n";

    // Step 6: Create transaction
    echo "6. Creating escrow transaction...\n";
    $transaction = App\Models\Transaction::create([
        'project_id' => $project->id,
        'payer_id' => $client->id,
        'payee_id' => $bid->freelancer_id,
        'amount' => $bid->bid_amount,
        'platform_fee' => $platformFee,
        'net_amount' => $netAmount,
        'type' => 'escrow',
        'status' => 'completed',
        'stripe_payment_intent_id' => 'demo_escrow_' . time(),
        'stripe_charge_id' => 'demo_charge_' . time(),
        'description' => 'Escrow payment for project #' . $project->id,
        'processed_at' => now(),
    ]);
    echo "   Transaction created: ID {$transaction->id}\n";

    // Step 7: Update bid status
    echo "7. Updating bid status...\n";
    $bid->update(['status' => 'accepted']);
    echo "   Bid status updated to: {$bid->fresh()->status}\n";

    // Step 8: Create contract
    echo "8. Creating contract...\n";
    $contractService = app(\App\Services\ContractService::class);
    $contract = $contractService->createContractFromBid($project, $bid);
    echo "   Contract created: ID {$contract->id}, Contract Number: {$contract->contract_id}\n";

    DB::commit();

    echo "\n🎉 BID ACCEPTANCE SUCCESSFUL!\n";
    echo "- Bid ID: {$bid->id} (Status: {$bid->fresh()->status})\n";
    echo "- Project ID: {$project->id}\n";
    echo "- Contract ID: {$contract->id}\n";
    echo "- Contract URL: http://localhost/contracts/{$contract->id}/sign\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "\n❌ BID ACCEPTANCE FAILED!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
