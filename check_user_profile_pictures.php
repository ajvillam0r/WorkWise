<?php

/**
 * Test 8: Current Database State
 * 
 * Purpose: See what's currently in the database for profile pictures
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Storage;

echo "========================================\n";
echo "Test 8: Current Database State\n";
echo "========================================\n\n";

try {
    // Get all users with profile pictures
    $users = User::whereNotNull('profile_picture')
        ->orWhereNotNull('profile_photo')
        ->get();
    
    $totalUsers = User::count();
    $usersWithPictures = $users->count();
    
    echo "Database Summary:\n";
    echo "  Total users: {$totalUsers}\n";
    echo "  Users with profile pictures: {$usersWithPictures}\n\n";
    
    if ($usersWithPictures > 0) {
        echo "Profile Picture URLs:\n";
        echo str_repeat('-', 80) . "\n";
        
        foreach ($users as $user) {
            echo "User ID: {$user->id} ({$user->first_name} {$user->last_name})\n";
            echo "  profile_picture: " . ($user->profile_picture ?? 'NULL') . "\n";
            echo "  profile_photo: " . ($user->profile_photo ?? 'NULL') . "\n";
            
            // Check URL format
            $url = $user->profile_picture ?? $user->profile_photo;
            if ($url) {
                if (strpos($url, '/r2/') === 0) {
                    echo "  Format: ✓ Proxy URL (/r2/...)\n";
                    
                    // Extract path
                    $path = substr($url, 4); // Remove '/r2/'
                    
                    // Check if file exists in R2
                    try {
                        $disk = Storage::disk('r2');
                        if ($disk->exists($path)) {
                            echo "  R2 Status: ✓ File exists\n";
                            $size = strlen($disk->get($path));
                            echo "  File Size: {$size} bytes\n";
                        } else {
                            echo "  R2 Status: ✗ File NOT found in R2\n";
                        }
                    } catch (\Exception $e) {
                        echo "  R2 Status: ⚠ Error checking: " . $e->getMessage() . "\n";
                    }
                } elseif (strpos($url, 'http') === 0) {
                    echo "  Format: ⚠ Direct URL (http/https)\n";
                } else {
                    echo "  Format: ⚠ Relative path (not /r2/)\n";
                }
            }
            echo "\n";
        }
        
        echo str_repeat('-', 80) . "\n\n";
    } else {
        echo "⚠ No users with profile pictures found in database\n\n";
    }
    
    // Check for orphaned files in R2
    echo "Checking for orphaned files in R2...\n";
    try {
        $disk = Storage::disk('r2');
        $files = $disk->allFiles('profiles');
        
        echo "  Total files in R2/profiles: " . count($files) . "\n";
        
        if (count($files) > 0) {
            $orphanedCount = 0;
            foreach ($files as $file) {
                // Check if any user references this file
                $found = User::where('profile_picture', '/r2/' . $file)
                    ->orWhere('profile_photo', '/r2/' . $file)
                    ->exists();
                
                if (!$found) {
                    $orphanedCount++;
                }
            }
            
            if ($orphanedCount > 0) {
                echo "  ⚠ Orphaned files (not referenced): {$orphanedCount}\n";
            } else {
                echo "  ✓ All files are referenced in database\n";
            }
        }
    } catch (\Exception $e) {
        echo "  ⚠ Error checking R2: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    echo "========================================\n";
    echo "RESULT: COMPLETE ✓\n";
    echo "========================================\n";
    
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n";
    echo "  Exception type: " . get_class($e) . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n\n";
    echo "========================================\n";
    echo "RESULT: FAIL ✗\n";
    echo "========================================\n";
    exit(1);
}

