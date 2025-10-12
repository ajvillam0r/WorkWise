<?php

// This script will forcefully recreate the storage link
$link = 'public/storage';
$target = '../storage/app/public';

echo "Forcing storage link recreation...\n";

// Try to remove existing link/directory using system commands
if (file_exists($link)) {
    // Try Linux commands first (for Railway)
    $output = shell_exec('rm -rf public/storage 2>&1');
    if ($output) {
        echo "Shell output: $output\n";
    }
    
    // Fallback: Try PHP methods
    if (file_exists($link)) {
        if (is_link($link)) {
            @unlink($link);
        } else if (is_dir($link)) {
            @rmdir($link);
        } else {
            @unlink($link);
        }
    }
}

// Create the symlink
if (!file_exists($link)) {
    if (symlink($target, $link)) {
        echo "✅ Storage link created successfully!\n";
        echo "   Link: $link -> $target\n";
    } else {
        echo "❌ Failed to create symlink\n";
    }
} else {
    echo "⚠️  public/storage still exists, trying Laravel command...\n";
}

// Verify
if (is_link($link)) {
    $actualTarget = readlink($link);
    echo "✅ Verified: Link points to $actualTarget\n";
}
