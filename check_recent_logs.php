<?php

$logFile = 'storage/logs/laravel.log';

if (!file_exists($logFile)) {
    echo "❌ Log file not found: $logFile\n";
    exit;
}

echo "=== RECENT LARAVEL LOGS ===\n\n";

// Read the file and get recent lines
$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if (!$lines) {
    echo "❌ Could not read log file\n";
    exit;
}

// Get the last 50 lines
$recentLines = array_slice($lines, -50);

// Filter for bid-related logs
$bidLogs = [];
foreach ($recentLines as $line) {
    if (stripos($line, 'bid') !== false || 
        stripos($line, 'step') !== false || 
        stripos($line, 'failed') !== false ||
        stripos($line, 'error') !== false) {
        $bidLogs[] = $line;
    }
}

if (empty($bidLogs)) {
    echo "ℹ️  No recent bid-related logs found\n";
    echo "Showing last 10 lines of log file:\n\n";
    foreach (array_slice($recentLines, -10) as $line) {
        echo $line . "\n";
    }
} else {
    echo "📋 Recent bid-related logs:\n\n";
    foreach ($bidLogs as $line) {
        echo $line . "\n";
    }
}

echo "\n=== END OF LOGS ===\n";
