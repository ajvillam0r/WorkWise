<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing detailed bid acceptance flow...\n";

try {
    // Find the employer we set up (ID: 2, balance: 100)
    $employer = App\Models\User::find(2);
    if (!$employer) {
        echo "Employer not found!\n";
        exit(1);
    }
    
    echo "Employer: {$employer->name} (ID: {$employer->id})\n";
    echo "Current balance: {$employer->escrow_balance}\n";

    // Find the bid (ID: 1, amount: 110506)
    $bid = App\Models\Bid::find(1);
    if (!$bid) {
        echo "Bid not found!\n";
        exit(1);
    }
    
    echo "Bid ID: {$bid->id}, Amount: {$bid->bid_amount}, Status: {$bid->status}\n";
    
    // Check the job
    $job = App\Models\GigJob::find($bid->job_id);
    echo "Job ID: {$job->id}, Employer ID: {$job->employer_id}\n";
    
    // Simulate the exact condition check from BidController
    if ($employer->escrow_balance < $bid->bid_amount) {
        echo "\n=== INSUFFICIENT ESCROW CONDITION MET ===\n";
        echo "Required: {$bid->bid_amount}\n";
        echo "Available: {$employer->escrow_balance}\n";
        
        // This is what the controller returns
        $errorData = [
            'error' => 'Insufficient escrow balance to accept this proposal.',
            'error_type' => 'insufficient_escrow',
            'required_amount' => $bid->bid_amount,
            'current_balance' => $employer->escrow_balance
        ];
        
        echo "\nError data that would be returned:\n";
        print_r($errorData);
        
        echo "\nThis data should be available in page.props.errors in the frontend\n";
        echo "The frontend should check: page.props.errors.error_type === 'insufficient_escrow'\n";
    } else {
        echo "\nSufficient balance - no error expected\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}