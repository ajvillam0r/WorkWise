<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use App\Http\Controllers\BidController;
use App\Services\ContractService;
use App\Models\User;
use App\Models\Bid;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Test bid acceptance
try {
    echo "Testing bid acceptance...\n";
    
    // Get the bid to accept
    $bid = Bid::find(11);
    if (!$bid) {
        echo "Bid not found!\n";
        exit;
    }
    
    echo "Found bid: ID {$bid->id}, Amount: {$bid->bid_amount}, Status: {$bid->status}\n";
    
    // Get the client (employer)
    $client = User::find($bid->job->employer_id);
    echo "Client: {$client->first_name} {$client->last_name}, Balance: {$client->escrow_balance}\n";
    
    // Authenticate as the client
    auth()->login($client);
    echo "Authenticated as client\n";
    
    // Create request
    $request = Request::create('/bids/' . $bid->id, 'PUT', ['status' => 'accepted']);
    $request->setUserResolver(function () use ($client) {
        return $client;
    });
    
    // Create controller with dependencies
    $contractService = app(ContractService::class);
    $controller = new BidController($contractService);
    
    echo "Attempting to accept bid...\n";
    
    // Call the update method
    $response = $controller->update($request, $bid);
    
    echo "Response type: " . get_class($response) . "\n";
    
    // Check the results
    $bid->refresh();
    $client->refresh();
    
    echo "After acceptance:\n";
    echo "- Bid Status: {$bid->status}\n";
    echo "- Client Balance: {$client->escrow_balance}\n";
    
    // Check if project was created
    $project = \App\Models\Project::where('bid_id', $bid->id)->first();
    if ($project) {
        echo "- Project Created: Yes, ID: {$project->id}, Status: {$project->status}\n";
    } else {
        echo "- Project Created: No\n";
    }
    
    // Check if contract was created
    $contract = \App\Models\Contract::where('bid_id', $bid->id)->first();
    if ($contract) {
        echo "- Contract Created: Yes, ID: {$contract->id}, Status: {$contract->status}\n";
    } else {
        echo "- Contract Created: No\n";
    }
    
    echo "Test completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
