<?php

echo "=== SIMPLE BID ACCEPTANCE DEBUG ===\n";

// Simple test without Laravel bootstrap
try {
    // Check if we can connect to database
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=workwise', 'root', '');
    echo "✅ Database connection successful\n";
    
    // Check if tables exist
    $tables = ['users', 'gig_jobs', 'bids', 'projects', 'transactions'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' exists\n";
        } else {
            echo "❌ Table '$table' missing\n";
        }
    }
    
    // Check for pending bids
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM bids WHERE status = 'pending'");
    $result = $stmt->fetch();
    echo "📊 Pending bids: {$result['count']}\n";
    
    // Check for users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'client'");
    $result = $stmt->fetch();
    echo "📊 Clients: {$result['count']}\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'freelancer'");
    $result = $stmt->fetch();
    echo "📊 Freelancers: {$result['count']}\n";
    
    // Get a specific pending bid for testing
    $stmt = $pdo->query("
        SELECT b.*, j.title as job_title, j.employer_id, u.first_name, u.last_name, u.escrow_balance 
        FROM bids b 
        JOIN gig_jobs j ON b.job_id = j.id 
        JOIN users u ON j.employer_id = u.id 
        WHERE b.status = 'pending' 
        LIMIT 1
    ");
    $bid = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($bid) {
        echo "\n=== FOUND PENDING BID ===\n";
        echo "Bid ID: {$bid['id']}\n";
        echo "Job: {$bid['job_title']}\n";
        echo "Amount: ₱{$bid['bid_amount']}\n";
        echo "Client: {$bid['first_name']} {$bid['last_name']}\n";
        echo "Client Balance: ₱{$bid['escrow_balance']}\n";
        echo "Sufficient Balance: " . ($bid['escrow_balance'] >= $bid['bid_amount'] ? 'Yes' : 'No') . "\n";
        
        if ($bid['escrow_balance'] < $bid['bid_amount']) {
            echo "\n⚠️  ISSUE: Client has insufficient balance!\n";
            echo "This could be causing the bid acceptance to fail.\n";
        }
    } else {
        echo "\n❌ No pending bids found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== NEXT STEPS ===\n";
echo "1. Check the browser console for detailed error logs\n";
echo "2. Check Laravel logs: storage/logs/laravel.log\n";
echo "3. Ensure client has sufficient escrow balance\n";
echo "4. Try with a fresh bid on a new job\n";
