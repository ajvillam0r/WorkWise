<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== WORKFLOW STATUS CHECK ===\n\n";

// Check pending bids
$pendingBids = App\Models\Bid::where('status', 'pending')->with(['job', 'freelancer'])->get();
echo "1. PENDING BIDS: " . $pendingBids->count() . "\n";
foreach($pendingBids as $bid) {
    echo "   - Bid ID: {$bid->id}, Job: {$bid->job->title}, Freelancer: {$bid->freelancer->first_name} {$bid->freelancer->last_name}, Amount: ₱{$bid->bid_amount}\n";
}

// Check contracts
$contracts = App\Models\Contract::with(['client', 'freelancer', 'job'])->get();
echo "\n2. CONTRACTS: " . $contracts->count() . "\n";
foreach($contracts as $contract) {
    echo "   - Contract ID: {$contract->contract_id}, Status: {$contract->status}, Job: {$contract->job->title}\n";
    echo "     Client Signed: " . ($contract->client_signed_at ? 'Yes' : 'No') . ", Freelancer Signed: " . ($contract->freelancer_signed_at ? 'Yes' : 'No') . "\n";
}

// Check active projects
$projects = App\Models\Project::with(['client', 'freelancer', 'job'])->get();
echo "\n3. PROJECTS: " . $projects->count() . "\n";
foreach($projects as $project) {
    echo "   - Project ID: {$project->id}, Status: {$project->status}, Job: {$project->job->title}\n";
    echo "     Completed: " . ($project->completed_at ? 'Yes' : 'No') . ", Client Approved: " . ($project->client_approved ? 'Yes' : 'No') . ", Payment Released: " . ($project->payment_released ? 'Yes' : 'No') . "\n";
}

// Check user balances
$freelancers = App\Models\User::where('role', 'freelancer')->get();
echo "\n4. FREELANCER BALANCES:\n";
foreach($freelancers as $freelancer) {
    echo "   - {$freelancer->first_name} {$freelancer->last_name}: ₱{$freelancer->escrow_balance}\n";
}

$clients = App\Models\User::where('role', 'client')->get();
echo "\n5. CLIENT BALANCES:\n";
foreach($clients as $client) {
    echo "   - {$client->first_name} {$client->last_name}: ₱{$client->escrow_balance}\n";
}

echo "\n=== END STATUS CHECK ===\n";
