<?php

function loadEnv($path) {
    if (!file_exists($path)) {
        return [];
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $env[trim($name)] = trim($value);
        }
    }
    return $env;
}

$env = loadEnv(__DIR__ . '/.env');

echo "--- Supabase Verification Script ---\n\n";

// 1. Database Verification
echo "[1/3] Testing Database Connection...\n";
try {
    $host = $env['DB_HOST'] ?? '';
    $port = $env['DB_PORT'] ?? '';
    $dbname = $env['DB_DATABASE'] ?? '';
    $user = $env['DB_USERNAME'] ?? '';
    $password = $env['DB_PASSWORD'] ?? '';

    echo "    Connecting to $host:$port...\n";
    
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $password, [PDO::ATTR_TIMEOUT => 5]);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT 1");
    echo "    ✅ Database Connection Successful!\n";
} catch (Exception $e) {
    echo "    ❌ Database Connection Failed: " . $e->getMessage() . "\n";
}
echo "\n";

// 2. Storage Verification
echo "[2/3] Testing Storage Connection (S3)...\n";
try {
    $endpoint = $env['AWS_ENDPOINT'] ?? '';
    $bucket = $env['AWS_BUCKET'] ?? '';

    if (!$endpoint || !$bucket) {
        throw new Exception("Missing S3 Environment Variables.");
    }

    echo "    Checking endpoint: $endpoint\n";
    
    // Simple check if endpoint is reachable
    $headers = @get_headers("$endpoint/$bucket");
    if ($headers && strpos($headers[0], '200') !== false || strpos($headers[0], '403') !== false) {
         echo "    ✅ Storage Endpoint Reachable (HTTP Response received)\n";
    } else {
         echo "    ❌ Storage Endpoint Unreachable (No response or 404)\n";
    }

} catch (Exception $e) {
    echo "    ❌ Storage Test Failed: " . $e->getMessage() . "\n";
}
echo "\n";

// 3. Authentication Verification (Config Check)
echo "[3/3] Testing Authentication Configuration...\n";
$supaUrl = $env['SUPABASE_URL'] ?? '';
$supaKey = $env['SUPABASE_KEY'] ?? '';
$viteUrl = $env['VITE_SUPABASE_URL'] ?? '';
$viteKey = $env['VITE_SUPABASE_KEY'] ?? '';

if ($supaUrl && $supaKey) {
    echo "    ✅ Backend Auth Config Present\n";
} else {
    echo "    ❌ Missing Backend Auth Config\n";
}

if ($viteUrl && $viteKey) {
    echo "    ✅ Frontend Auth Config Present\n";
} else {
    echo "    ❌ Missing Frontend Auth Config\n";
}

echo "\n--- Verification Complete ---\n";
