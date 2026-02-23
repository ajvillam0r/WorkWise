<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking DB Schema for 'users' table...\n";

$driver = DB::connection()->getDriverName();
echo "Driver: $driver\n";


$result = [];
$result['driver'] = $driver;

if ($driver === 'sqlite') {
    $info = DB::select("PRAGMA table_info(users)");
    foreach ($info as $col) {
        if ($col->name === 'id_verification_status') {
            $result['column_info'] = $col;
        }
    }
} elseif ($driver === 'mysql') {
    $info = DB::select("SHOW COLUMNS FROM users WHERE Field = 'id_verification_status'");
    $result['column_info'] = $info[0] ?? null;
} elseif ($driver === 'pgsql') {
    $info = DB::select("SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id_verification_status'");
    $result['column_info'] = $info[0] ?? null;
}

$latestUser = \App\Models\User::latest()->first();
if ($latestUser) {
    $result['latest_user'] = [
        'id' => $latestUser->id,
        'id_verification_status' => $latestUser->id_verification_status,
        'created_at' => $latestUser->created_at->toIso8601String(),
    ];
}

echo json_encode($result, JSON_PRETTY_PRINT);

