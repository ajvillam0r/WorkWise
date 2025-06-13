<?php

// Simple log viewer accessible via browser
// Access via: http://localhost/debug-logs.php

$logFile = '../storage/logs/laravel.log';

echo "<html><head><title>Debug Logs</title></head><body>";
echo "<h1>Recent Laravel Logs</h1>";
echo "<p>Last updated: " . date('Y-m-d H:i:s') . "</p>";

if (!file_exists($logFile)) {
    echo "<p style='color: red;'>❌ Log file not found: $logFile</p>";
    echo "</body></html>";
    exit;
}

// Read the file
$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if (!$lines) {
    echo "<p style='color: red;'>❌ Could not read log file</p>";
    echo "</body></html>";
    exit;
}

// Get the last 100 lines
$recentLines = array_slice($lines, -100);

// Filter for important logs
$importantLogs = [];
foreach ($recentLines as $line) {
    if (stripos($line, 'emergency') !== false || 
        stripos($line, 'bid') !== false || 
        stripos($line, 'step') !== false || 
        stripos($line, 'failed') !== false ||
        stripos($line, 'error') !== false) {
        $importantLogs[] = $line;
    }
}

echo "<h2>Important Logs (Emergency, Bid, Error related)</h2>";
if (empty($importantLogs)) {
    echo "<p>ℹ️ No important logs found in recent entries</p>";
} else {
    echo "<pre style='background: #f5f5f5; padding: 10px; overflow-x: auto;'>";
    foreach ($importantLogs as $line) {
        // Highlight emergency logs
        if (stripos($line, 'emergency') !== false) {
            echo "<span style='color: red; font-weight: bold;'>$line</span>\n";
        } elseif (stripos($line, 'error') !== false) {
            echo "<span style='color: orange;'>$line</span>\n";
        } else {
            echo "$line\n";
        }
    }
    echo "</pre>";
}

echo "<h2>All Recent Logs (Last 20 lines)</h2>";
echo "<pre style='background: #f0f0f0; padding: 10px; overflow-x: auto;'>";
foreach (array_slice($recentLines, -20) as $line) {
    echo htmlspecialchars($line) . "\n";
}
echo "</pre>";

echo "<p><a href='javascript:location.reload()'>🔄 Refresh Logs</a></p>";
echo "</body></html>";
