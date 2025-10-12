# WorkWise 500 Error - Comprehensive Fix Guide

## Issues Found in Your Configuration

### 1. **Environment Variable Issues**

**Problem:** APP_DEBUG is set as a string `"false"` instead of boolean
```env
# ❌ WRONG
APP_DEBUG="false"

# ✅ CORRECT
APP_DEBUG=false
```

**Problem:** You have both `DB_URL` and `DATABASE_URL` which is redundant and can cause conflicts
```env
# Remove one of these - keep DATABASE_URL for Railway
DB_URL="${{Postgres-479474aa-68e1-496c-9d0c-8de73e2c4ae5.DATABASE_URL}}"
DATABASE_URL="${{Postgres.DATABASE_PUBLIC_URL}}"
```

**Problem:** CACHE_DRIVER vs CACHE_STORE naming inconsistency
```env
# ❌ Your config uses CACHE_DRIVER
CACHE_DRIVER="redis"

# ✅ Laravel 11 uses CACHE_STORE
CACHE_STORE=redis
```

### 2. **Redis Configuration Issues**

Your Redis host is using `RAILWAY_PRIVATE_DOMAIN` which may not be correct for Redis.
Railway typically provides a Redis URL in the format: `redis://default:password@host:port`

### 3. **Missing Environment Variables**

Add these to your Railway environment:
```env
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=public
```

## Recommended Railway Environment Variables

```env
# Application
APP_NAME=WorkWise
APP_ENV=production
APP_KEY=base64:DBUZCq+YUBzF0jPtt1ZdtKPsl37dm3tOS0y6g0JfNjc=
APP_DEBUG=false
APP_URL=https://workwise-production.up.railway.app

# Database (Use Railway's provided variables)
DB_CONNECTION=pgsql
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}

# Alternative if DATABASE_URL doesn't work:
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Cache & Session
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis (Use Railway's Redis service)
REDIS_URL=${{Redis.REDIS_URL}}
# OR individual variables:
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
REDIS_PORT=6379
REDIS_CLIENT=phpredis

# Filesystem
FILESYSTEM_DISK=public

# Mail (Configure with your actual SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@workwise.com
MAIL_FROM_NAME="${APP_NAME}"

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error
LOG_STACK=single

# Broadcasting
BROADCAST_CONNECTION=log

# Session
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
```

## Fix Commands (Run on Railway)

### Step 1: Clear All Caches
```bash
railway run php artisan config:clear
railway run php artisan cache:clear
railway run php artisan route:clear
railway run php artisan view:clear
railway run php artisan optimize:clear
```

### Step 2: Fix Storage Link
```bash
# Remove broken symlink
railway run rm -f public/storage

# Create proper symlink
railway run php artisan storage:link --force

# Verify the link
railway run ls -la public/
railway run readlink public/storage
```

### Step 3: Set Proper Permissions
```bash
railway run chmod -R 775 storage bootstrap/cache
railway run chmod -R 775 storage/logs
railway run chmod -R 775 storage/framework
```

### Step 4: Rebuild Configuration Cache
```bash
railway run php artisan config:cache
railway run php artisan route:cache
railway run php artisan view:cache
```

### Step 5: Check Logs
```bash
# View last 50 lines of log
railway run tail -50 storage/logs/laravel.log

# Or view entire log
railway run cat storage/logs/laravel.log
```

### Step 6: Test Database Connection
```bash
railway run php artisan migrate:status
railway run php artisan db:show
```

## Debugging Commands

### Check Environment Variables
```bash
railway run php -r "echo 'APP_KEY: ' . env('APP_KEY') . PHP_EOL;"
railway run php -r "echo 'DB_CONNECTION: ' . env('DB_CONNECTION') . PHP_EOL;"
railway run php -r "echo 'DATABASE_URL: ' . env('DATABASE_URL') . PHP_EOL;"
railway run php artisan env
```

### Check PHP Extensions
```bash
railway run php -m | grep -E "(pgsql|redis|pdo_pgsql)"
```

### Test Redis Connection
```bash
railway run php artisan tinker --execute="echo 'Redis test: '; Cache::put('test', 'value', 60); echo Cache::get('test');"
```

### Check Storage Directory Structure
```bash
railway run ls -la storage/
railway run ls -la storage/app/
railway run ls -la storage/framework/
railway run ls -la bootstrap/cache/
```

## Common Issues & Solutions

### Issue: "No application encryption key has been specified"
**Solution:** Run `railway run php artisan key:generate` or ensure APP_KEY is set in Railway variables

### Issue: "SQLSTATE[08006] [7] could not connect to server"
**Solution:** Check your DATABASE_URL or DB_* variables are correct

### Issue: "Connection refused [tcp://127.0.0.1:6379]"
**Solution:** Redis configuration is wrong. Use Railway's Redis service variables

### Issue: "The stream or file could not be opened"
**Solution:** Storage permissions issue. Run chmod commands above

### Issue: "Class not found"
**Solution:** Run `railway run composer dump-autoload` and `railway run php artisan optimize:clear`

## Quick Fix Script

Create this as `fix-railway.sh` and run it:

```bash
#!/bin/bash
echo "🔧 Clearing caches..."
railway run php artisan optimize:clear

echo "🔗 Fixing storage link..."
railway run rm -f public/storage
railway run php artisan storage:link --force

echo "🔑 Setting permissions..."
railway run chmod -R 775 storage bootstrap/cache

echo "⚡ Rebuilding cache..."
railway run php artisan config:cache
railway run php artisan route:cache

echo "📊 Checking database..."
railway run php artisan migrate:status

echo "📝 Checking recent logs..."
railway run tail -20 storage/logs/laravel.log

echo "✅ Done! Check your app now."
```

## What to Check If Still Getting 500

1. **Railway Logs:**
   ```bash
   railway logs
   ```

2. **Laravel Logs:**
   ```bash
   railway run cat storage/logs/laravel.log
   ```

3. **Nginx/Web Server Logs:**
   Railway typically shows these in the deployment logs

4. **Database Connection:**
   ```bash
   railway run php artisan tinker --execute="DB::connection()->getPdo();"
   ```

5. **Verify Build:**
   - Check if `composer install` ran successfully
   - Check if migrations ran
   - Check if assets were built (`npm run build`)

## Railway-Specific Notes

1. Railway automatically runs these on deploy (check your `nixpacks.toml` or build settings):
   - `composer install`
   - `php artisan migrate --force`
   - `php artisan storage:link`
   - `npm run build`

2. If you don't have a `Procfile`, create one:
   ```
   web: php artisan serve --host=0.0.0.0 --port=$PORT
   ```

3. Or use `nixpacks.toml`:
   ```toml
   [phases.setup]
   nixPkgs = ['php82', 'php82Packages.composer', 'nodejs_20']

   [phases.build]
   cmds = [
     'composer install --no-dev --optimize-autoloader',
     'npm ci',
     'npm run build',
     'php artisan storage:link'
   ]

   [start]
   cmd = 'php artisan serve --host=0.0.0.0 --port=$PORT'
   ```
