<?php

/**
 * CSRF/419 Diagnostic Script
 * Run this to identify what's broken in your CSRF setup
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CSRF/419 DIAGNOSTIC REPORT ===\n\n";

// 1. Check session configuration
echo "1. SESSION CONFIGURATION\n";
echo "   Driver: " . config('session.driver') . "\n";
echo "   Lifetime: " . config('session.lifetime') . " minutes\n";
echo "   Domain: " . (config('session.domain') ?: 'null (local)') . "\n";
echo "   Secure: " . (config('session.secure') ? 'true' : 'false') . "\n";
echo "   Same Site: " . config('session.same_site') . "\n";

if (config('session.driver') !== 'database') {
    echo "   ❌ WARNING: Session driver should be 'database' for reliability\n";
} else {
    echo "   ✅ Session driver is correct\n";
}

if (config('session.lifetime') < 120) {
    echo "   ❌ WARNING: Session lifetime is too short (< 2 hours)\n";
} else {
    echo "   ✅ Session lifetime is adequate\n";
}

echo "\n";

// 2. Check if sessions table exists
echo "2. DATABASE SESSIONS TABLE\n";
try {
    $count = DB::table('sessions')->count();
    echo "   ✅ Sessions table exists (contains {$count} sessions)\n";
} catch (Exception $e) {
    echo "   ❌ ERROR: Sessions table not found or inaccessible\n";
    echo "   Run: php artisan session:table && php artisan migrate\n";
}

echo "\n";

// 3. Check CSRF token generation
echo "3. CSRF TOKEN GENERATION\n";
try {
    $token = csrf_token();
    echo "   ✅ CSRF token generates: " . substr($token, 0, 20) . "...\n";
} catch (Exception $e) {
    echo "   ❌ ERROR: Cannot generate CSRF token\n";
}

echo "\n";

// 4. Check HandleInertiaRequests middleware
echo "4. HANDLEINERTIAREQUESTS MIDDLEWARE\n";
$middlewareFile = app_path('Http/Middleware/HandleInertiaRequests.php');
$middlewareContent = file_get_contents($middlewareFile);

if (strpos($middlewareContent, "'csrf_token'") !== false || strpos($middlewareContent, '"csrf_token"') !== false) {
    echo "   ✅ Middleware shares CSRF token\n";
} else {
    echo "   ❌ CRITICAL: Middleware does NOT share CSRF token\n";
    echo "   This is the main cause of 419 errors!\n";
    echo "   Add this line to the share() method:\n";
    echo "   'csrf_token' => csrf_token(),\n";
}

echo "\n";

// 5. Check bootstrap.js for axios interceptor
echo "5. AXIOS CONFIGURATION (bootstrap.js)\n";
$bootstrapFile = resource_path('js/bootstrap.js');
if (file_exists($bootstrapFile)) {
    $bootstrapContent = file_get_contents($bootstrapFile);
    
    if (strpos($bootstrapContent, 'X-CSRF-TOKEN') !== false) {
        echo "   ✅ Axios sets CSRF token header\n";
    } else {
        echo "   ❌ WARNING: Axios doesn't set CSRF token header\n";
    }
    
    if (strpos($bootstrapContent, 'interceptors.response') !== false && strpos($bootstrapContent, '419') !== false) {
        echo "   ✅ Axios has 419 error interceptor\n";
    } else {
        echo "   ❌ CRITICAL: Axios has NO 419 error interceptor\n";
        echo "   This means 419 errors won't auto-recover\n";
    }
} else {
    echo "   ❌ ERROR: bootstrap.js not found\n";
}

echo "\n";

// 6. Check if CSRF helpers exist
echo "6. CSRF HELPER UTILITIES\n";
$csrfHelpersFile = resource_path('js/utils/csrfHelpers.js');
if (file_exists($csrfHelpersFile)) {
    echo "   ✅ CSRF helpers file exists\n";
} else {
    echo "   ⚠️  CSRF helpers file not found (optional but recommended)\n";
}

echo "\n";

// 7. Check routes
echo "7. CSRF-PROTECTED ROUTES\n";
try {
    $routes = Route::getRoutes();
    $webRoutes = 0;
    $csrfProtected = 0;
    
    foreach ($routes as $route) {
        if (in_array('web', $route->middleware())) {
            $webRoutes++;
            if (in_array('POST', $route->methods()) || in_array('PUT', $route->methods()) || in_array('DELETE', $route->methods())) {
                $csrfProtected++;
            }
        }
    }
    
    echo "   Web routes: {$webRoutes}\n";
    echo "   CSRF-protected routes: {$csrfProtected}\n";
    echo "   ✅ Routes configured\n";
} catch (Exception $e) {
    echo "   ⚠️  Could not analyze routes\n";
}

echo "\n";

// 8. Summary
echo "=== DIAGNOSIS SUMMARY ===\n\n";

$issues = [];

if (config('session.driver') !== 'database') {
    $issues[] = "Session driver is not 'database'";
}

if (!strpos(file_get_contents($middlewareFile), "'csrf_token'")) {
    $issues[] = "HandleInertiaRequests middleware doesn't share CSRF token (CRITICAL)";
}

if (file_exists($bootstrapFile)) {
    $bootstrapContent = file_get_contents($bootstrapFile);
    if (!strpos($bootstrapContent, 'interceptors.response') || !strpos($bootstrapContent, '419')) {
        $issues[] = "Axios doesn't have 419 error interceptor (CRITICAL)";
    }
}

if (empty($issues)) {
    echo "✅ No critical issues found!\n";
    echo "If you're still seeing 419 errors, check:\n";
    echo "- Production environment variables (SESSION_DOMAIN, SESSION_SECURE_COOKIE)\n";
    echo "- Clear all caches: php artisan optimize:clear\n";
    echo "- Check browser console for errors\n";
} else {
    echo "❌ FOUND " . count($issues) . " ISSUE(S):\n\n";
    foreach ($issues as $i => $issue) {
        echo ($i + 1) . ". " . $issue . "\n";
    }
    echo "\nFix these issues to resolve 419 errors.\n";
}

echo "\n=== END OF REPORT ===\n";
