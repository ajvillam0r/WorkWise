<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Creating test scenario with insufficient escrow balance...\n";

try {
    // Find an employer
    $employer = App\Models\User::where('user_type', 'employer')->first();
    if (!$employer) {
        echo "No employer found!\n";
        exit(1);
    }
    
    echo "Original balance for {$employer->name} (ID: {$employer->id}): {$employer->escrow_balance}\n";

    // Temporarily reduce balance to create insufficient funds scenario
    $originalBalance = $employer->escrow_balance;
    $employer->escrow_balance = 100; // Set very low balance
    $employer->save();

    echo "New balance: {$employer->escrow_balance}\n";

    // Find a bid with amount higher than 100
    $bid = App\Models\Bid::where('status', 'pending')->where('bid_amount', '>', 100)->first();
    if ($bid) {
        echo "Found bid with amount: {$bid->bid_amount} (ID: {$bid->id})\n";
        echo "Job ID: {$bid->job_id}\n";
        
        // Check if this employer owns the job for this bid
        $job = App\Models\GigJob::find($bid->job_id);
        if ($job && $job->employer_id == $employer->id) {
            echo "Perfect! Employer owns this job and can test accepting the bid.\n";
            echo "Test URL: /jobs/{$job->id}\n";
        } else {
            echo "This employer doesn't own this job. Finding a job they own...\n";
            $ownedJob = App\Models\GigJob::where('employer_id', $employer->id)->first();
            if ($ownedJob) {
                echo "Found owned job ID: {$ownedJob->id}\n";
                echo "Test URL: /jobs/{$ownedJob->id}\n";
                
                // Check if there are bids on this job
                $ownedJobBids = App\Models\Bid::where('job_id', $ownedJob->id)->where('status', 'pending')->get();
                echo "Bids on this job: " . $ownedJobBids->count() . "\n";
                foreach ($ownedJobBids as $ownedBid) {
                    echo "- Bid ID: {$ownedBid->id}, Amount: {$ownedBid->bid_amount}\n";
                }
            }
        }
    } else {
        echo "No suitable bid found\n";
    }

    echo "\nTo test the error modal:\n";
    echo "1. Login as employer ID: {$employer->id}\n";
    echo "2. Go to a job page where they have pending bids\n";
    echo "3. Try to accept a bid with amount > 100\n";
    echo "4. The error modal should appear\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}