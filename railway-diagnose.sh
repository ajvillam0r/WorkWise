#!/bin/bash

# WorkWise Railway Diagnostic Script
# Run this to diagnose 500 errors

echo "=================================================="
echo "🔍 WorkWise Railway Diagnostic Report"
echo "=================================================="
echo ""

# Check PHP version
echo "1. PHP Version:"
railway run php -v | head -1
echo ""

# Check required extensions
echo "2. Required PHP Extensions:"
railway run php -m | grep -E "(pdo_pgsql|pgsql|redis|mbstring|xml|ctype|json|bcmath|fileinfo|tokenizer)" || echo "⚠️  Some extensions might be missing"
echo ""

# Check environment variables
echo "3. Environment Variables (sanitized):"
railway run php -r "
    echo 'APP_NAME: ' . env('APP_NAME') . PHP_EOL;
    echo 'APP_ENV: ' . env('APP_ENV') . PHP_EOL;
    echo 'APP_DEBUG: ' . var_export(env('APP_DEBUG'), true) . PHP_EOL;
    echo 'APP_KEY: ' . (env('APP_KEY') ? 'SET (' . strlen(env('APP_KEY')) . ' chars)' : 'NOT SET') . PHP_EOL;
    echo 'DB_CONNECTION: ' . env('DB_CONNECTION') . PHP_EOL;
    echo 'DATABASE_URL: ' . (env('DATABASE_URL') ? 'SET' : 'NOT SET') . PHP_EOL;
    echo 'CACHE_STORE: ' . env('CACHE_STORE', 'not set') . PHP_EOL;
    echo 'SESSION_DRIVER: ' . env('SESSION_DRIVER', 'not set') . PHP_EOL;
    echo 'FILESYSTEM_DISK: ' . env('FILESYSTEM_DISK', 'not set') . PHP_EOL;
"
echo ""

# Check directory permissions
echo "4. Directory Permissions:"
railway run ls -ld storage bootstrap/cache
railway run ls -ld storage/logs storage/framework storage/app
echo ""

# Check storage link
echo "5. Storage Symlink:"
railway run ls -la public/ | grep storage
LINK=$(railway run readlink public/storage 2>&1)
echo "Link target: $LINK"
echo ""

# Check if storage directories exist
echo "6. Storage Directory Structure:"
railway run find storage -type d -maxdepth 2 2>&1 || echo "Could not list storage"
echo ""

# Test database connection
echo "7. Database Connection Test:"
railway run php artisan tinker --execute="
    try {
        DB::connection()->getPdo();
        echo '✅ Database connected successfully' . PHP_EOL;
        echo 'Database name: ' . DB::connection()->getDatabaseName() . PHP_EOL;
    } catch (\Exception \$e) {
        echo '❌ Database connection failed: ' . \$e->getMessage() . PHP_EOL;
    }
" 2>&1
echo ""

# Check migrations
echo "8. Migration Status:"
railway run php artisan migrate:status 2>&1 | head -10
echo ""

# Check for critical errors in logs
echo "9. Recent Critical Errors (last 50 lines):"
railway run tail -50 storage/logs/laravel.log 2>&1 | grep -i "error\|exception\|fatal" | tail -10 || echo "No recent errors found or log file doesn't exist"
echo ""

# Check composer dependencies
echo "10. Composer Autoload Status:"
railway run php -r "
    if (file_exists('vendor/autoload.php')) {
        echo '✅ Composer autoload exists' . PHP_EOL;
        require 'vendor/autoload.php';
        echo '✅ Composer autoload works' . PHP_EOL;
    } else {
        echo '❌ Composer autoload missing' . PHP_EOL;
    }
" 2>&1
echo ""

# Check configuration cache
echo "11. Configuration Cache Status:"
railway run ls -lh bootstrap/cache/*.php 2>&1 || echo "No cached files"
echo ""

# Try to boot Laravel
echo "12. Laravel Boot Test:"
railway run php artisan about 2>&1 | head -20 || echo "❌ Could not boot Laravel"
echo ""

# Check web server process
echo "13. Web Server Status:"
railway logs --limit 10 2>&1 || echo "Could not fetch Railway logs"
echo ""

echo "=================================================="
echo "✅ Diagnostic report completed"
echo "=================================================="
echo ""
echo "Common Issues & Solutions:"
echo ""
echo "If APP_KEY is NOT SET:"
echo "  → Set APP_KEY in Railway environment variables"
echo ""
echo "If Database connection failed:"
echo "  → Check DATABASE_URL variable in Railway"
echo "  → Ensure Postgres service is linked"
echo ""
echo "If Storage link is wrong:"
echo "  → Run: railway run rm public/storage && railway run php artisan storage:link"
echo ""
echo "If permissions errors:"
echo "  → Run: railway run chmod -R 775 storage bootstrap/cache"
echo ""
echo "If configuration cache issues:"
echo "  → Run: railway run php artisan optimize:clear"
echo ""
