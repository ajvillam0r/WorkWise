<?php

$link = 'public/storage';
$target = '../storage/app/public';

echo "Checking storage link..." . PHP_EOL;

if (file_exists($link)) {
    if (is_link($link)) {
        $current = readlink($link);
        echo "Current link points to: $current" . PHP_EOL;
        
        if ($current !== $target && $current !== 'storage/app/public') {
            echo "Link is incorrect! Fixing..." . PHP_EOL;
            unlink($link);
            symlink($target, $link);
            echo "✅ Fixed link to: $target" . PHP_EOL;
        } else {
            echo "✅ Link is correct" . PHP_EOL;
        }
    } else {
        echo "⚠️ Exists but is not a link, type: " . filetype($link) . PHP_EOL;
        if (is_dir($link)) {
            rmdir($link);
            symlink($target, $link);
            echo "✅ Removed directory and created link to: $target" . PHP_EOL;
        }
    }
} else {
    symlink($target, $link);
    echo "✅ Created new link to: $target" . PHP_EOL;
}

// Verify the link
if (is_link($link)) {
    $finalTarget = readlink($link);
    echo "Final verification - Link points to: $finalTarget" . PHP_EOL;
}
