<?php

/**
 * Test 3: PHP Configuration
 * 
 * Purpose: Check PHP upload limits and execution time
 */

echo "========================================\n";
echo "Test 3: PHP Configuration\n";
echo "========================================\n\n";

$checks = [
    'upload_max_filesize' => '5M',
    'post_max_size' => '10M',
    'max_execution_time' => '60',
    'memory_limit' => '128M',
];

echo "Checking PHP configuration...\n\n";

$allPass = true;

function convertToBytes($value) {
    $value = trim($value);
    $last = strtolower($value[strlen($value) - 1]);
    $value = (int) $value;
    
    switch ($last) {
        case 'g':
            $value *= 1024;
            // fallthrough
        case 'm':
            $value *= 1024;
            // fallthrough
        case 'k':
            $value *= 1024;
    }
    
    return $value;
}

foreach ($checks as $setting => $minimum) {
    $current = ini_get($setting);
    
    // Convert to bytes for comparison
    $currentBytes = convertToBytes($current);
    $minimumBytes = convertToBytes($minimum);
    
    $status = $currentBytes >= $minimumBytes ? '✓' : '✗';
    $pass = $currentBytes >= $minimumBytes;
    
    if (!$pass) {
        $allPass = false;
    }
    
    echo "{$status} {$setting}\n";
    echo "  Current: {$current}\n";
    echo "  Minimum: {$minimum}\n";
    
    if ($pass) {
        echo "  Status: OK\n";
    } else {
        echo "  Status: TOO LOW - May cause upload failures\n";
    }
    echo "\n";
}

// Check file uploads enabled
$fileUploads = ini_get('file_uploads');
echo ($fileUploads ? '✓' : '✗') . " file_uploads\n";
echo "  Current: " . ($fileUploads ? 'On' : 'Off') . "\n";
echo "  Status: " . ($fileUploads ? 'OK' : 'DISABLED - File uploads will fail') . "\n\n";

if (!$fileUploads) {
    $allPass = false;
}

// Check max_input_time
$maxInputTime = ini_get('max_input_time');
echo "ℹ max_input_time\n";
echo "  Current: {$maxInputTime}\n";
echo "  Note: -1 means unlimited\n\n";

echo "========================================\n";
if ($allPass && $fileUploads) {
    echo "RESULT: PASS ✓\n";
    echo "========================================\n";
    echo "PHP configuration is suitable for file uploads!\n";
} else {
    echo "RESULT: FAIL ✗\n";
    echo "========================================\n";
    echo "PHP configuration may cause upload issues!\n";
    echo "Please update php.ini settings.\n";
    exit(1);
}

