<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CONTRACT ACCESS DEBUG ===\n\n";

// Find the most recent contract
$contract = App\Models\Contract::with(['client', 'freelancer', 'job', 'project'])
    ->orderBy('created_at', 'desc')
    ->first();

if (!$contract) {
    echo "No contracts found.\n";
    exit;
}

echo "Most Recent Contract:\n";
echo "- Contract ID: {$contract->id}\n";
echo "- Contract Number: {$contract->contract_id}\n";
echo "- Status: {$contract->status}\n";
echo "- Client ID: {$contract->client_id}\n";
echo "- Client: {$contract->client->first_name} {$contract->client->last_name} ({$contract->client->email})\n";
echo "- Freelancer ID: {$contract->freelancer_id}\n";
echo "- Freelancer: {$contract->freelancer->first_name} {$contract->freelancer->last_name} ({$contract->freelancer->email})\n";
echo "- Job: {$contract->job->title}\n";
echo "- Project ID: {$contract->project_id}\n\n";

// Check who can sign
echo "Authorization Check:\n";

// Test with client
$clientCanSign = $contract->canUserSign($contract->client_id);
echo "- Client can sign: " . ($clientCanSign ? 'Yes' : 'No') . "\n";

// Test with freelancer
$freelancerCanSign = $contract->canUserSign($contract->freelancer_id);
echo "- Freelancer can sign: " . ($freelancerCanSign ? 'Yes' : 'No') . "\n";

// Check signatures
$clientSigned = $contract->hasUserSigned($contract->client_id);
$freelancerSigned = $contract->hasUserSigned($contract->freelancer_id);

echo "- Client has signed: " . ($clientSigned ? 'Yes' : 'No') . "\n";
echo "- Freelancer has signed: " . ($freelancerSigned ? 'Yes' : 'No') . "\n";

echo "- Is fully signed: " . ($contract->isFullySigned() ? 'Yes' : 'No') . "\n";
echo "- Is cancelled: " . ($contract->isCancelled() ? 'Yes' : 'No') . "\n";

// Check all users to see who might be logged in
echo "\n=== ALL USERS ===\n";
$users = App\Models\User::all();
foreach ($users as $user) {
    $canSign = $contract->canUserSign($user->id);
    $role = $contract->getUserRole($user->id);
    echo "- {$user->first_name} {$user->last_name} (ID: {$user->id}, Role: {$user->role}) - Can sign: " . ($canSign ? 'Yes' : 'No') . " - Contract role: " . ($role ?: 'None') . "\n";
}

echo "\n=== CONTRACT SIGNING URLS ===\n";
echo "Contract Show: http://localhost/contracts/{$contract->id}\n";
echo "Contract Sign: http://localhost/contracts/{$contract->id}/sign\n";

echo "\n=== RECOMMENDATIONS ===\n";
if (!$clientCanSign && !$freelancerCanSign) {
    echo "❌ Neither client nor freelancer can sign. Check contract status and signatures.\n";
} elseif ($clientCanSign) {
    echo "✅ Client should sign first. Login as: {$contract->client->email}\n";
} elseif ($freelancerCanSign) {
    echo "✅ Freelancer should sign first. Login as: {$contract->freelancer->email}\n";
}
