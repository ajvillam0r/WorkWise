<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== BID ACCEPTANCE DEBUG ===\n\n";

// Find a pending bid to test with
$pendingBid = App\Models\Bid::where('status', 'pending')
    ->with(['job', 'freelancer'])
    ->first();

if (!$pendingBid) {
    echo "No pending bids found. Creating a test bid...\n";
    
    // Find an open job
    $job = App\Models\GigJob::where('status', 'open')->first();
    if (!$job) {
        echo "No open jobs found. Please create a job first.\n";
        exit;
    }
    
    // Find a freelancer
    $freelancer = App\Models\User::where('role', 'freelancer')->first();
    if (!$freelancer) {
        echo "No freelancers found. Please create a freelancer first.\n";
        exit;
    }
    
    // Create a test bid
    $pendingBid = App\Models\Bid::create([
        'job_id' => $job->id,
        'freelancer_id' => $freelancer->id,
        'bid_amount' => 5000,
        'proposal_message' => 'Test bid for debugging purposes',
        'estimated_days' => 7,
        'status' => 'pending'
    ]);
    
    echo "Created test bid ID: {$pendingBid->id}\n";
}

echo "Testing with Bid ID: {$pendingBid->id}\n";
echo "Job: {$pendingBid->job->title}\n";
echo "Freelancer: {$pendingBid->freelancer->first_name} {$pendingBid->freelancer->last_name}\n";
echo "Amount: ₱{$pendingBid->bid_amount}\n";
echo "Current Status: {$pendingBid->status}\n\n";

// Check client balance
$client = $pendingBid->job->employer;
echo "Client: {$client->first_name} {$client->last_name}\n";
echo "Client Balance: ₱{$client->escrow_balance}\n\n";

// Check if client has sufficient balance
if ($client->escrow_balance < $pendingBid->bid_amount) {
    echo "❌ ISSUE FOUND: Client has insufficient balance!\n";
    echo "Required: ₱{$pendingBid->bid_amount}\n";
    echo "Available: ₱{$client->escrow_balance}\n";
    echo "Adding funds to client account...\n";
    
    $client->increment('escrow_balance', $pendingBid->bid_amount + 1000);
    echo "✅ Added ₱" . ($pendingBid->bid_amount + 1000) . " to client balance\n";
    echo "New Balance: ₱{$client->fresh()->escrow_balance}\n\n";
}

// Check if ContractService exists and works
try {
    $contractService = app(\App\Services\ContractService::class);
    echo "✅ ContractService is available\n";
} catch (Exception $e) {
    echo "❌ ContractService error: " . $e->getMessage() . "\n";
}

// Check database constraints
echo "\n=== DATABASE CHECKS ===\n";
echo "Projects table exists: " . (Schema::hasTable('projects') ? 'Yes' : 'No') . "\n";
echo "Contracts table exists: " . (Schema::hasTable('contracts') ? 'Yes' : 'No') . "\n";
echo "Transactions table exists: " . (Schema::hasTable('transactions') ? 'Yes' : 'No') . "\n";

echo "\n=== READY FOR TESTING ===\n";
echo "You can now test bid acceptance with Bid ID: {$pendingBid->id}\n";
echo "URL: http://localhost/jobs/{$pendingBid->job_id}\n";
