<?php
/**
 * Railway Debug Script
 * This script helps diagnose Railway deployment issues
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🚂 Railway Debug Script\n";
echo "=====================\n\n";

// Check if we're in Railway environment
$isRailway = !empty($_ENV['RAILWAY_ENVIRONMENT']) || !empty(getenv('RAILWAY_ENVIRONMENT'));
echo "Environment: " . ($isRailway ? "Railway" : "Local") . "\n\n";

// 1. Check PHP version and extensions
echo "📋 PHP Information:\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Memory Limit: " . ini_get('memory_limit') . "\n";
echo "Max Execution Time: " . ini_get('max_execution_time') . "\n";

$requiredExtensions = ['pdo', 'pdo_sqlite', 'pdo_pgsql', 'json', 'mbstring', 'openssl'];
echo "\nRequired Extensions:\n";
foreach ($requiredExtensions as $ext) {
    $status = extension_loaded($ext) ? "✅" : "❌";
    echo "  {$status} {$ext}\n";
}

// 2. Check environment variables
echo "\n🔧 Environment Variables:\n";
$envVars = [
    'APP_ENV',
    'APP_DEBUG',
    'APP_KEY',
    'DB_CONNECTION',
    'DB_HOST',
    'DB_PORT',
    'DB_DATABASE',
    'DB_USERNAME',
    'DATABASE_URL'
];

foreach ($envVars as $var) {
    $value = $_ENV[$var] ?? getenv($var) ?? 'NOT SET';
    $displayValue = in_array($var, ['APP_KEY', 'DB_PASSWORD', 'DATABASE_URL']) 
        ? (($value !== 'NOT SET') ? '***SET***' : 'NOT SET') 
        : $value;
    echo "  {$var}: {$displayValue}\n";
}

// 3. Test database connection
echo "\n📊 Database Connection Test:\n";
try {
    // Try to load Laravel bootstrap
    $autoloadPath = __DIR__ . '/vendor/autoload.php';
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
        
        // Bootstrap Laravel
        $app = require_once __DIR__ . '/bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        
        // Test database connection
        $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
        echo "✅ Database connection successful\n";
        echo "  Driver: " . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) . "\n";
        
        // Test basic queries
        $userCount = \Illuminate\Support\Facades\DB::table('users')->count();
        echo "  Users table: {$userCount} records\n";
        
        $gigWorkerCount = \Illuminate\Support\Facades\DB::table('users')
            ->where('user_type', 'gig_worker')
            ->count();
        echo "  Gig workers: {$gigWorkerCount} records\n";
        
    } else {
        echo "❌ Laravel autoload not found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

// 4. Check file permissions and paths
echo "\n📁 File System Checks:\n";
$paths = [
    'storage/logs' => 'writable',
    'storage/framework/cache' => 'writable',
    'storage/framework/sessions' => 'writable',
    'storage/framework/views' => 'writable',
    'bootstrap/cache' => 'writable',
    'database.sqlite' => 'exists'
];

foreach ($paths as $path => $check) {
    $fullPath = __DIR__ . '/' . $path;
    
    if ($check === 'writable') {
        $status = is_writable($fullPath) ? "✅" : "❌";
        echo "  {$status} {$path} (writable)\n";
    } elseif ($check === 'exists') {
        $status = file_exists($fullPath) ? "✅" : "❌";
        echo "  {$status} {$path} (exists)\n";
    }
}

// 5. Test GigWorkerDashboard route simulation
echo "\n🎛️  Dashboard Route Simulation:\n";
try {
    if (class_exists('\App\Http\Controllers\GigWorkerDashboardController')) {
        echo "✅ GigWorkerDashboardController class exists\n";
        
        // Try to instantiate the controller
        $controller = new \App\Http\Controllers\GigWorkerDashboardController();
        echo "✅ Controller instantiation successful\n";
        
        // Check if we can find a gig worker
        if (class_exists('\App\Models\User')) {
            $gigWorker = \App\Models\User::where('user_type', 'gig_worker')->first();
            if ($gigWorker) {
                echo "✅ Found gig worker: {$gigWorker->name} (ID: {$gigWorker->id})\n";
                
                // Test individual methods using reflection
                $reflection = new ReflectionClass($controller);
                $methods = ['getGigWorkerStats', 'getActiveContracts', 'getJobInvites', 'getEarningsSummary'];
                
                foreach ($methods as $methodName) {
                    try {
                        if ($reflection->hasMethod($methodName)) {
                            $method = $reflection->getMethod($methodName);
                            $method->setAccessible(true);
                            $result = $method->invoke($controller, $gigWorker);
                            echo "✅ {$methodName}: executed successfully\n";
                        } else {
                            echo "❌ {$methodName}: method not found\n";
                        }
                    } catch (Exception $e) {
                        echo "❌ {$methodName}: " . $e->getMessage() . "\n";
                    }
                }
            } else {
                echo "❌ No gig worker found in database\n";
            }
        } else {
            echo "❌ User model not found\n";
        }
    } else {
        echo "❌ GigWorkerDashboardController class not found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Dashboard simulation failed: " . $e->getMessage() . "\n";
    echo "  Stack trace: " . $e->getTraceAsString() . "\n";
}

// 6. Memory and performance info
echo "\n💾 Performance Information:\n";
echo "  Memory usage: " . number_format(memory_get_usage(true) / 1024 / 1024, 2) . " MB\n";
echo "  Peak memory: " . number_format(memory_get_peak_usage(true) / 1024 / 1024, 2) . " MB\n";
echo "  Execution time: " . number_format(microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'], 3) . " seconds\n";

echo "\n✅ Debug script completed!\n";
echo "If you see this message, PHP is working correctly.\n";
echo "Check the output above for any ❌ errors that might indicate the issue.\n";