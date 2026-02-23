<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- VERIFICATION START ---\n";

// 1. Check Schema
$driver = DB::connection()->getDriverName();
echo "Driver: $driver\n";
if ($driver === 'sqlite') {
    $info = DB::select("PRAGMA table_info(users)");
    foreach ($info as $col) {
        if ($col->name === 'id_verification_status') {
            echo "Column Default: " . var_export($col->dflt_value, true) . "\n";
            echo "Column NotNull: " . var_export($col->notnull, true) . "\n";
        }
    }
}

// 2. Create New User
$user = User::create([
    'first_name' => 'Test',
    'last_name' => 'Verification',
    'email' => 'test_verification_' . time() . '@example.com',
    'password' => Hash::make('password'),
    'user_type' => 'gig_worker',
]);

echo "New User ID: " . $user->id . "\n";
echo "New User Verification Status: " . var_export($user->id_verification_status, true) . "\n";

if ($user->id_verification_status === null) {
    echo "SUCCESS: Status is null.\n";
} else {
    echo "FAILURE: Status is " . $user->id_verification_status . "\n";
}

echo "--- VERIFICATION END ---\n";
