<?php

$logFile = 'storage/logs/laravel.log';

if (!file_exists($logFile)) {
    echo "Log file not found: $logFile\n";
    exit;
}

echo "=== RECENT LARAVEL LOGS (Last 30 lines) ===\n\n";

// Get the last 30 lines of the log file
$command = "tail -30 " . escapeshellarg($logFile);
$output = shell_exec($command);

if ($output) {
    echo $output;
} else {
    // Fallback method
    $lines = file($logFile);
    if ($lines) {
        $recentLines = array_slice($lines, -30);
        foreach ($recentLines as $line) {
            echo $line;
        }
    } else {
        echo "Could not read log file.\n";
    }
}

echo "\n=== END OF LOGS ===\n";
