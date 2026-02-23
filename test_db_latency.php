<?php

$host = 'aws-0-ap-southeast-1.pooler.supabase.com';
$port = '5432';
$dbname = 'postgres';
$user = 'postgres.wpuxtzzpqjauxueczbnn';
$password = 'Ajhv#456';

echo "Testing connection to $host:$port...\n";

$start = microtime(true);

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $password, [PDO::ATTR_TIMEOUT => 5]);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $end = microtime(true);
    $duration = round(($end - $start) * 1000, 2);
    
    echo "Connected successfully in {$duration} ms.\n";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT 1");
    echo "Query 'SELECT 1' successful.\n";
    
} catch (PDOException $e) {
    $end = microtime(true);
    $duration = round(($end - $start) * 1000, 2);
    echo "Connection failed after {$duration} ms.\n";
    echo "Error: " . $e->getMessage() . "\n";
}
