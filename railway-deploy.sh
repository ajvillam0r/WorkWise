#!/bin/bash

echo "🚀 Starting Railway deployment..."

# Clear all caches to ensure fresh configuration
echo "🧹 Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Run database migrations
echo "📊 Running migrations..."
php artisan migrate --force

# Optimize for production
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Verify Stripe configuration
echo "🔍 Verifying Stripe configuration..."
php artisan tinker --execute="
    \$config = config('stripe');
    echo 'Stripe Key: ' . (empty(\$config['key']) ? '❌ NOT SET' : '✅ SET') . PHP_EOL;
    echo 'Stripe Secret: ' . (empty(\$config['secret']) ? '❌ NOT SET' : '✅ SET') . PHP_EOL;
    echo 'Webhook Secret: ' . (empty(\$config['webhook_secret']) ? '❌ NOT SET' : '✅ SET') . PHP_EOL;
    echo 'Currency: ' . \$config['currency'] . PHP_EOL;
"

echo "✅ Deployment complete!"
