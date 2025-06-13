<?php

$logFile = 'storage/logs/laravel.log';

if (!file_exists($logFile)) {
    echo "Log file not found: $logFile\n";
    exit;
}

echo "=== RECENT LARAVEL LOGS ===\n\n";

// Get the last 50 lines of the log file
$lines = file($logFile);
$recentLines = array_slice($lines, -50);

foreach ($recentLines as $line) {
    echo $line;
}

echo "\n=== END OF LOGS ===\n";
