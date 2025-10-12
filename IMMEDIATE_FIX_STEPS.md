# 🚨 IMMEDIATE FIX - Step by Step

## Your Current Issues Identified:

1. ❌ `APP_DEBUG="false"` has quotes (should be `false` without quotes)
2. ❌ Using `CACHE_DRIVER` instead of `CACHE_STORE`
3. ❌ Both `DB_URL` and `DATABASE_URL` (causes conflicts)
4. ⚠️  Redis configuration may be wrong
5. ⚠️  Storage link might be broken

---

## 🎯 STEP-BY-STEP FIX (Do in order)

### STEP 1: Update Railway Environment Variables (5 minutes)

Go to Railway Dashboard → Your Project → Variables tab

**REMOVE or FIX these variables:**
```
✖ Remove: DB_URL
✖ Change: APP_DEBUG="false"  →  APP_DEBUG=false
✖ Change: CACHE_DRIVER="redis"  →  CACHE_STORE=database
✖ Change: SESSION_DRIVER="redis"  →  SESSION_DRIVER=database
✖ Change: QUEUE_CONNECTION="redis"  →  QUEUE_CONNECTION=database
```

**KEEP these variables exactly as is:**
```
✓ APP_NAME=WorkWise
✓ APP_ENV=production
✓ APP_KEY=base64:DBUZCq+YUBzF0jPtt1ZdtKPsl37dm3tOS0y6g0JfNjc=
✓ APP_URL=https://workwise-production.up.railway.app
✓ DB_CONNECTION=pgsql
✓ DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
```

**ADD these if missing:**
```
+ FILESYSTEM_DISK=public
+ SESSION_LIFETIME=120
+ LOG_CHANNEL=stack
+ LOG_LEVEL=error
+ BROADCAST_CONNECTION=log
```

**After updating, Railway will automatically redeploy.** Wait for it to finish (check the "Deployments" tab).

---

### STEP 2: Clear Caches (2 minutes)

Once the redeploy from Step 1 completes, run:

```bash
railway run php artisan optimize:clear
```

This clears all cached configuration, routes, views, and application cache.

---

### STEP 3: Fix Storage Link (2 minutes)

```bash
# Remove broken symlink
railway run rm -f public/storage

# Create proper symlink
railway run php artisan storage:link --force

# Verify it worked
railway run readlink public/storage
```

**Expected output:** `../storage/app/public` or `storage/app/public`

---

### STEP 4: Set Permissions (1 minute)

```bash
railway run chmod -R 775 storage bootstrap/cache
```

---

### STEP 5: Rebuild Configuration Cache (1 minute)

```bash
railway run php artisan config:cache
railway run php artisan route:cache
```

---

### STEP 6: Check Logs (2 minutes)

```bash
railway run tail -50 storage/logs/laravel.log
```

Look for any ERROR or EXCEPTION messages. If the file doesn't exist or is empty, that's actually good!

---

### STEP 7: Test Your Application

Visit: https://workwise-production.up.railway.app

**If it works:** ✅ You're done!

**If still 500 error:** Continue to Step 8

---

### STEP 8: Deep Diagnostic (5 minutes)

Run the diagnostic script:

```bash
bash railway-diagnose.sh
```

Or run these manually:

```bash
# Check environment loaded correctly
railway run php artisan about

# Check database connection
railway run php artisan migrate:status

# Check Laravel can boot
railway run php artisan route:list | head -5

# Get exact error
railway logs | tail -50
```

---

## 🔍 WHAT TO LOOK FOR

### In Railway Logs (`railway logs`):
- ✅ "Server running on http://0.0.0.0:XXXX"
- ❌ "SQLSTATE" → Database problem
- ❌ "Connection refused" → Redis problem (we fixed this with Step 1)
- ❌ "Class not found" → Autoload problem

### In Laravel Logs:
- ❌ "No application encryption key" → APP_KEY problem
- ❌ "could not find driver" → pgsql extension missing
- ❌ "Permission denied" → Storage permissions (Step 4)

---

## 📋 QUICK COPY-PASTE COMMANDS

Run all fixes at once (if you're in a hurry):

```bash
# All-in-one fix command
railway run php artisan optimize:clear && \
railway run rm -f public/storage && \
railway run php artisan storage:link --force && \
railway run chmod -R 775 storage bootstrap/cache && \
railway run php artisan config:cache && \
railway run php artisan route:cache && \
echo "✅ Fix complete! Check your app now."
```

Check everything is working:

```bash
# All-in-one diagnostic command
railway run php artisan about && \
railway run php artisan migrate:status && \
railway run readlink public/storage && \
railway run ls -ld storage/logs
```

---

## 🎯 EXPECTED RESULTS AFTER FIX

After completing all steps, you should see:

```bash
$ railway run php artisan about
Environment: production
Debug Mode: OFF
URL: https://workwise-production.up.railway.app
Database: pgsql
Cache: database
Session: database
```

```bash
$ railway run php artisan migrate:status
+------+--------------------------------------+-------+
| Ran? | Migration                            | Batch |
+------+--------------------------------------+-------+
| Yes  | 0001_01_01_000000_create_users_table | 1     |
| Yes  | 0001_01_01_000001_create_cache_table | 1     |
...
```

```bash
$ railway run readlink public/storage
../storage/app/public
```

---

## 🆘 IF STILL NOT WORKING

### Option A: Switch to Individual Database Variables

In Railway Variables, instead of:
```
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
```

Use:
```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

### Option B: Enable Debug Temporarily

**⚠️ ONLY FOR DEBUGGING - REMOVE AFTER:**

In Railway Variables:
```
APP_DEBUG=true
LOG_LEVEL=debug
```

Then redeploy and check the error in your browser.

**IMPORTANT:** After fixing, immediately set back to:
```
APP_DEBUG=false
LOG_LEVEL=error
```

### Option C: Check Specific Issues

```bash
# Test database connection
railway run php artisan tinker --execute="
    try {
        \$pdo = DB::connection()->getPdo();
        echo 'Database: OK' . PHP_EOL;
    } catch (\Exception \$e) {
        echo 'Database ERROR: ' . \$e->getMessage() . PHP_EOL;
    }
"

# Test file writing
railway run php artisan tinker --execute="
    try {
        \$path = storage_path('logs/test.txt');
        file_put_contents(\$path, 'test');
        echo 'Storage: OK' . PHP_EOL;
    } catch (\Exception \$e) {
        echo 'Storage ERROR: ' . \$e->getMessage() . PHP_EOL;
    }
"

# Test config loading
railway run php artisan tinker --execute="
    echo 'APP_KEY: ' . (config('app.key') ? 'SET' : 'NOT SET') . PHP_EOL;
    echo 'DB: ' . config('database.default') . PHP_EOL;
"
```

---

## 📞 NEED MORE HELP?

If after all these steps it's still not working:

1. **Save full diagnostic:**
   ```bash
   bash railway-diagnose.sh > diagnostic.txt
   railway logs > railway.txt  
   railway run cat storage/logs/laravel.log > laravel.txt
   ```

2. **Look for the actual error message** (not just "500 Server Error")

3. **Most common remaining issues:**
   - Missing PHP extension (pgsql, mbstring, etc.)
   - Railway build failed (check Deployments tab)
   - Database not migrated (run `migrate --force`)
   - Assets not built (run `npm run build`)

---

## ✅ SUCCESS CHECKLIST

After fixing, you should be able to:

- [ ] Visit your app URL without 500 error
- [ ] See the login/home page
- [ ] Log in (if you have users seeded)
- [ ] No errors in Railway logs
- [ ] No errors in Laravel logs

---

**IMPORTANT:** After everything works, remember to:
1. ✅ Keep `APP_DEBUG=false` in production
2. ✅ Keep `LOG_LEVEL=error` in production  
3. ✅ Never commit `.env` file with real credentials
4. ✅ Monitor Railway logs regularly

---

**Start with STEP 1 above and work through each step in order.**

Good luck! 🚀
