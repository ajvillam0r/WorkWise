#!/bin/bash

# WorkWise Railway 500 Error Fix Script
# Run this script to fix common deployment issues

set -e

echo "=================================================="
echo "🔧 WorkWise Railway Fix Script"
echo "=================================================="
echo ""

# Step 1: Clear all caches
echo "Step 1/7: Clearing caches..."
railway run php artisan optimize:clear
railway run php artisan config:clear
railway run php artisan cache:clear
railway run php artisan route:clear
railway run php artisan view:clear
echo "✅ Caches cleared"
echo ""

# Step 2: Fix storage permissions
echo "Step 2/7: Setting storage permissions..."
railway run chmod -R 775 storage || echo "⚠️  Could not set permissions"
railway run chmod -R 775 bootstrap/cache || echo "⚠️  Could not set permissions"
railway run chmod -R 775 storage/logs || echo "⚠️  Could not set permissions"
railway run chmod -R 775 storage/framework || echo "⚠️  Could not set permissions"
echo "✅ Permissions set"
echo ""

# Step 3: Fix storage link
echo "Step 3/7: Fixing storage symlink..."
railway run rm -f public/storage || echo "⚠️  No existing symlink to remove"
railway run php artisan storage:link --force
echo "✅ Storage link created"
echo ""

# Step 4: Verify storage link
echo "Step 4/7: Verifying storage link..."
railway run ls -la public/ | grep storage || echo "⚠️  Could not verify symlink"
LINK_TARGET=$(railway run readlink public/storage 2>/dev/null || echo "not found")
echo "Storage link points to: $LINK_TARGET"
if [[ "$LINK_TARGET" == *"storage/app/public"* ]]; then
    echo "✅ Storage link is correct"
else
    echo "⚠️  Storage link might be incorrect: $LINK_TARGET"
fi
echo ""

# Step 5: Check environment
echo "Step 5/7: Checking environment variables..."
railway run php -r "echo 'APP_KEY: ' . (env('APP_KEY') ? 'SET' : 'NOT SET') . PHP_EOL;"
railway run php -r "echo 'DB_CONNECTION: ' . env('DB_CONNECTION') . PHP_EOL;"
railway run php -r "echo 'APP_ENV: ' . env('APP_ENV') . PHP_EOL;"
railway run php -r "echo 'APP_DEBUG: ' . (env('APP_DEBUG') ? 'true' : 'false') . PHP_EOL;"
echo ""

# Step 6: Rebuild caches
echo "Step 6/7: Rebuilding configuration cache..."
railway run php artisan config:cache
railway run php artisan route:cache
railway run php artisan view:cache
echo "✅ Configuration cached"
echo ""

# Step 7: Check database and logs
echo "Step 7/7: Running diagnostics..."
echo ""
echo "Database Status:"
railway run php artisan migrate:status 2>&1 || echo "⚠️  Could not check migrations"
echo ""
echo "Recent Logs (last 30 lines):"
railway run tail -30 storage/logs/laravel.log 2>&1 || echo "⚠️  No logs found or could not read logs"
echo ""

echo "=================================================="
echo "✅ Fix script completed!"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "1. Check your Railway deployment logs: railway logs"
echo "2. Visit your app URL: https://workwise-production.up.railway.app"
echo "3. If still getting 500, check the logs above for specific errors"
echo ""
echo "Common issues to verify in Railway dashboard:"
echo "- APP_KEY is set correctly"
echo "- APP_DEBUG=false (no quotes)"
echo "- DATABASE_URL is set to \${{Postgres.DATABASE_PUBLIC_URL}}"
echo "- DB_CONNECTION=pgsql"
echo "- All Postgres service variables are linked"
echo ""
