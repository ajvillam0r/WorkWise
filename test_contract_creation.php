<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🧪 Testing Contract Creation\n";
echo "============================\n\n";

try {
    // Find a recent project without a contract
    $project = App\Models\Project::whereDoesntHave('contract')->first();
    
    if (!$project) {
        echo "❌ No project found without contract!\n";
        exit(1);
    }
    
    echo "📋 Found project without contract:\n";
    echo "   - Project ID: {$project->id}\n";
    echo "   - Client: {$project->client->first_name} {$project->client->last_name}\n";
    echo "   - Freelancer: {$project->freelancer->first_name} {$project->freelancer->last_name}\n";
    echo "   - Amount: ₱{$project->agreed_amount}\n";
    echo "   - Status: {$project->status}\n\n";
    
    // Get the bid
    $bid = $project->bid;
    if (!$bid) {
        echo "❌ No bid found for this project!\n";
        exit(1);
    }
    
    echo "📝 Found bid:\n";
    echo "   - Bid ID: {$bid->id}\n";
    echo "   - Amount: ₱{$bid->bid_amount}\n";
    echo "   - Status: {$bid->status}\n\n";
    
    // Test contract creation
    echo "🔄 Testing contract creation...\n";
    
    try {
        $contractService = app(App\Services\ContractService::class);
        $contract = $contractService->createContractFromBid($project, $bid);
        
        echo "✅ Contract created successfully!\n";
        echo "   - Contract ID: {$contract->id}\n";
        echo "   - Contract Number: {$contract->contract_id}\n";
        echo "   - Status: {$contract->status}\n";
        echo "   - Total Payment: ₱{$contract->total_payment}\n\n";
        
        // Test notification
        echo "🔄 Testing notification...\n";
        $contractService->sendContractNotification($contract, $bid->freelancer, 'contract_ready');
        
        echo "✅ Notification sent successfully!\n\n";
        
        // Check messages
        $messageCount = App\Models\Message::where('receiver_id', $bid->freelancer_id)->count();
        echo "📧 Messages for freelancer: {$messageCount}\n";
        
    } catch (Exception $e) {
        echo "❌ Contract creation failed: " . $e->getMessage() . "\n";
        echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

echo "\n✅ All tests passed!\n";
