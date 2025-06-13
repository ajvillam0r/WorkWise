<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use App\Http\Controllers\BidController;
use App\Services\ContractService;
use App\Models\User;
use App\Models\Bid;
use App\Models\Project;
use App\Models\Contract;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Test complete bid acceptance flow
try {
    echo "=== Testing Complete Bid Acceptance Flow ===\n\n";
    
    // Get bid ID 9 (test 2 project)
    $bid = Bid::find(9);
    if (!$bid) {
        echo "Bid not found!\n";
        exit;
    }
    
    echo "Testing with:\n";
    echo "- Bid ID: {$bid->id}\n";
    echo "- Job: {$bid->job->title}\n";
    echo "- Client: {$bid->job->employer->first_name} {$bid->job->employer->last_name}\n";
    echo "- Freelancer: {$bid->freelancer->first_name} {$bid->freelancer->last_name}\n";
    echo "- Amount: ₱{$bid->bid_amount}\n\n";
    
    // Get the client
    $client = User::find($bid->job->employer_id);
    echo "Client balance before: ₱{$client->escrow_balance}\n";
    
    // Check if client has sufficient balance
    if ($client->escrow_balance < $bid->bid_amount) {
        echo "ERROR: Insufficient client balance!\n";
        exit;
    }
    
    // Authenticate as the client
    auth()->login($client);
    echo "Authenticated as: {$client->first_name} {$client->last_name}\n\n";
    
    // Create request to accept the bid
    $request = Request::create('/bids/' . $bid->id, 'PUT', ['status' => 'accepted']);
    $request->setUserResolver(function () use ($client) {
        return $client;
    });
    
    // Create controller with dependencies
    $contractService = app(ContractService::class);
    $controller = new BidController($contractService);
    
    echo "=== Accepting Bid ===\n";
    
    // Call the update method to accept the bid
    $response = $controller->update($request, $bid);
    
    echo "Response received: " . get_class($response) . "\n\n";
    
    // Refresh models to get updated data
    $bid->refresh();
    $client->refresh();
    
    echo "=== Results After Bid Acceptance ===\n";
    echo "- Bid Status: {$bid->status}\n";
    echo "- Client Balance: ₱{$client->escrow_balance}\n";
    
    // Check if project was created
    $project = Project::where('bid_id', $bid->id)->first();
    if ($project) {
        echo "- Project Created: Yes\n";
        echo "  - Project ID: {$project->id}\n";
        echo "  - Status: {$project->status}\n";
        echo "  - Agreed Amount: ₱{$project->agreed_amount}\n";
        echo "  - Platform Fee: ₱{$project->platform_fee}\n";
        echo "  - Net Amount: ₱{$project->net_amount}\n";
        
        // Check if contract was created
        $contract = Contract::where('project_id', $project->id)->first();
        if ($contract) {
            echo "- Contract Created: Yes\n";
            echo "  - Contract ID: {$contract->contract_id}\n";
            echo "  - Status: {$contract->status}\n";
            echo "  - Total Payment: ₱{$contract->total_payment}\n";
            echo "  - Project Start Date: {$contract->project_start_date}\n";
            echo "  - Project End Date: {$contract->project_end_date}\n";
        } else {
            echo "- Contract Created: No\n";
        }
    } else {
        echo "- Project Created: No\n";
    }
    
    echo "\n=== Test Completed Successfully! ===\n";
    
    // Show the redirect URL if available
    if ($response instanceof \Illuminate\Http\RedirectResponse) {
        $targetUrl = $response->getTargetUrl();
        echo "Redirect URL: {$targetUrl}\n";
        
        // Check for flash data
        $session = $response->getSession();
        if ($session && $session->has('success')) {
            echo "Success Message: " . $session->get('success') . "\n";
        }
        if ($session && $session->has('redirect')) {
            echo "Contract Signing URL: " . $session->get('redirect') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
