<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Checking id_verification_status Column ===\n\n";

// Get column information
$columns = DB::select("PRAGMA table_info(users)");

echo "Looking for id_verification_status column...\n\n";

foreach ($columns as $column) {
    if ($column->name === 'id_verification_status') {
        echo "Column found:\n";
        echo "  Name: {$column->name}\n";
        echo "  Type: {$column->type}\n";
        echo "  Not Null: " . ($column->notnull ? 'Yes' : 'No') . "\n";
        echo "  Default: " . ($column->dflt_value ?? 'NULL') . "\n";
        echo "  Primary Key: " . ($column->pk ? 'Yes' : 'No') . "\n";
        break;
    }
}

echo "\n";
