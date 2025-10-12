<?php

function deleteDirectory($dir) {
    if (!file_exists($dir)) {
        return true;
    }
    
    if (!is_dir($dir)) {
        return unlink($dir);
    }
    
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }
        
        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }
    }
    
    return rmdir($dir);
}

$path = 'public/storage';

if (file_exists($path)) {
    if (is_link($path)) {
        unlink($path);
        echo "✅ Removed symlink\n";
    } else if (is_dir($path)) {
        deleteDirectory($path);
        echo "✅ Removed directory\n";
    } else {
        unlink($path);
        echo "✅ Removed file\n";
    }
} else {
    echo "ℹ️  public/storage does not exist\n";
}
