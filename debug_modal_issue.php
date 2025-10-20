<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing insufficient escrow balance scenario...\n";

try {
    // Check employer users with escrow balances
    $employers = App\Models\User::where('user_type', 'employer')->take(3)->get(['id', 'name', 'email', 'escrow_balance']);
    echo "Employer users with escrow balances:\n";
    foreach ($employers as $user) {
        echo "- ID: {$user->id}, Name: {$user->name}, Balance: {$user->escrow_balance}\n";
    }

    // Check pending bids
    $bids = App\Models\Bid::where('status', 'pending')->take(3)->get(['id', 'job_id', 'gig_worker_id', 'bid_amount', 'status']);
    echo "Pending bids:\n";
    foreach ($bids as $bid) {
        echo "- Bid ID: {$bid->id}, Job ID: {$bid->job_id}, Amount: {$bid->bid_amount}, Status: {$bid->status}\n";
    }

    // Test what happens when we try to accept a bid with insufficient balance
    if ($bids->count() > 0 && $employers->count() > 0) {
        $bid = $bids->first();
        $employer = $employers->first();
        
        echo "\nTesting scenario:\n";
        echo "- Employer {$employer->name} (Balance: {$employer->escrow_balance}) trying to accept bid of {$bid->bid_amount}\n";
        
        if ($employer->escrow_balance < $bid->bid_amount) {
            echo "- This should trigger insufficient escrow error\n";
            
            // Simulate the error response
            $errorData = [
                'error' => 'Insufficient escrow balance to accept this proposal.',
                'error_type' => 'insufficient_escrow',
                'required_amount' => $bid->bid_amount,
                'current_balance' => $employer->escrow_balance
            ];
            
            echo "- Error data that should be returned:\n";
            print_r($errorData);
        } else {
            echo "- Employer has sufficient balance, no error expected\n";
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}