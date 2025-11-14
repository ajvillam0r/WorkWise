<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== MANUAL BID ACCEPTANCE TEST ===\n\n";

// Find a pending bid
$bid = App\Models\Bid::where('status', 'pending')
    ->with(['job.employer', 'freelancer'])
    ->first();

if (!$bid) {
    echo "No pending bids found.\n";
    exit;
}

echo "Found pending bid:\n";
echo "- Bid ID: {$bid->id}\n";
echo "- Job: {$bid->job->title}\n";
echo "- Freelancer: {$bid->freelancer->first_name} {$bid->freelancer->last_name}\n";
echo "- Amount: ₱" . number_format($bid->bid_amount, 2) . "\n";
echo "- Client: {$bid->job->employer->first_name} {$bid->job->employer->last_name}\n";
echo "- Client Balance: ₱" . number_format($bid->job->employer->escrow_balance, 2) . "\n\n";

// Check if client has sufficient balance
if ($bid->job->employer->escrow_balance < $bid->bid_amount) {
    echo "❌ Client has insufficient balance. Adding funds...\n";
    $bid->job->employer->increment('escrow_balance', $bid->bid_amount + 1000);
    echo "✅ Added funds. New balance: ₱" . number_format($bid->job->employer->fresh()->escrow_balance, 2) . "\n\n";
}

echo "Attempting to accept bid...\n";

try {
    // Simulate the bid acceptance process
    DB::beginTransaction();
    
    $client = $bid->job->employer;
    
    // Check balance again
    if ($client->escrow_balance < $bid->bid_amount) {
        throw new Exception("Insufficient balance");
    }
    
    // Reject other bids
    App\Models\Bid::where('job_id', $bid->job_id)
        ->where('id', '!=', $bid->id)
        ->update(['status' => 'rejected']);
    
    // Update job status
    $bid->job->update(['status' => 'in_progress']);
    
    // Calculate fees
    $platformFee = $bid->bid_amount * 0.05;
    $netAmount = $bid->bid_amount - $platformFee;
    
    // Create project
    $project = App\Models\Project::create([
        'job_id' => $bid->job_id,
        'client_id' => $bid->job->employer_id,
        'freelancer_id' => $bid->freelancer_id,
        'bid_id' => $bid->id,
        'agreed_amount' => $bid->bid_amount,
        'platform_fee' => $platformFee,
        'net_amount' => $netAmount,
        'status' => 'active',
        'started_at' => now(),
    ]);
    
    echo "✅ Project created: ID {$project->id}\n";
    
    // Deduct from client balance
    $client->decrement('escrow_balance', $bid->bid_amount);
    echo "✅ Deducted ₱" . number_format($bid->bid_amount, 2) . " from client balance\n";
    
    // Create transaction
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
    
    echo "✅ Transaction created: ID {$transaction->id}\n";
    
    // Update bid status
    $bid->update(['status' => 'accepted']);
    echo "✅ Bid status updated to: {$bid->fresh()->status}\n";
    
    // Create contract
    $contractService = app(\App\Services\ContractService::class);
    $contract = $contractService->createContractFromBid($project, $bid);
    
    echo "✅ Contract created: ID {$contract->id}\n";
    
    DB::commit();
    
    echo "\n🎉 BID ACCEPTANCE SUCCESSFUL!\n";
    echo "- Project ID: {$project->id}\n";
    echo "- Contract ID: {$contract->id}\n";
    echo "- Bid Status: {$bid->fresh()->status}\n";
    echo "- Client New Balance: ₱" . number_format($client->fresh()->escrow_balance, 2) . "\n";
    
} catch (Exception $e) {
    DB::rollBack();
    echo "\n❌ BID ACCEPTANCE FAILED!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
