<?php

use Illuminate\Support\Facades\Storage;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Testing Storage Connection...\n";
    $disk = Storage::disk('s3');
    $filename = 'test_connection_' . time() . '.txt';
    $content = 'Hello Supabase Storage!';
    
    echo "Attempting to write file: $filename\n";
    $disk->put($filename, $content);
    echo "Write successful.\n";
    
    echo "Attempting to read file: $filename\n";
    $readContent = $disk->get($filename);
    echo "Read content: $readContent\n";
    
    if ($readContent === $content) {
        echo "Content match confirmed.\n";
    } else {
        echo "Content mismatch!\n";
    }
    
    echo "Attempting to delete file: $filename\n";
    $disk->delete($filename);
    echo "Delete successful.\n";
    
    echo "Storage Test PASSED.\n";
} catch (\Exception $e) {
    echo "Storage Test FAILED: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
