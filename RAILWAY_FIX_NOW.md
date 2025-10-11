# 🚨 IMMEDIATE RAILWAY FIX - DO THIS NOW

## What I Just Fixed:
✅ Updated `config/database.php` to properly use `DATABASE_URL`

## What You Need To Do (5 steps):

### STEP 1: Commit and Push This Fix (2 minutes)

```bash
git add config/database.php
git commit -m "Fix: Use DATABASE_URL instead of DB_URL for Railway"
git push
```

Railway will automatically redeploy.

---

### STEP 2: Update Railway Environment Variables (3 minutes)

**Go to:** Railway Dashboard → Your Project → Variables Tab

**CRITICAL CHANGES - Fix These Now:**

```diff
❌ REMOVE these variables (causing conflicts):
- DB_URL (remove completely)

✅ CHANGE these (remove quotes):
- APP_DEBUG="false"  →  APP_DEBUG=false
- CACHE_DRIVER="redis"  →  CACHE_STORE=file
- SESSION_DRIVER="redis"  →  SESSION_DRIVER=file  
- QUEUE_CONNECTION="redis"  →  QUEUE_CONNECTION=database

✅ ADD these if missing:
+ FILESYSTEM_DISK=public
+ SESSION_LIFETIME=120
+ LOG_CHANNEL=stack
+ LOG_LEVEL=error
```

**FOR DATABASE_URL - Try Option A first, then Option B if it fails:**

**Option A: Use Railway's Public URL**
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Option B: Use Individual Variables (More Reliable)**

Remove `DATABASE_URL` completely and add these instead:
```env
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

---

### STEP 3: Wait for Redeploy

After changing variables, Railway will automatically redeploy (takes 2-3 minutes).

Watch the deployment in: Railway Dashboard → Deployments tab

---

### STEP 4: Clear Caches on Railway

Once deployment is complete, run:

```bash
railway run php artisan optimize:clear
```

If this STILL fails, run these individual commands:

```bash
railway run php artisan config:clear
railway run php artisan cache:clear
railway run php artisan route:clear
railway run php artisan view:clear
```

---

### STEP 5: Fix Storage Link

```bash
railway run php artisan storage:link --force
railway run chmod -R 775 storage bootstrap/cache
```

---

## After All Steps Complete:

Test your application:
```
Visit: https://workwise-production.up.railway.app
```

Check logs if still 500:
```bash
railway logs
```

---

## Quick Checklist:

- [ ] Committed and pushed the database config fix
- [ ] Removed `DB_URL` from Railway variables
- [ ] Changed `APP_DEBUG="false"` to `APP_DEBUG=false` (no quotes)
- [ ] Changed cache/session drivers from "redis" to file/database
- [ ] Fixed `DATABASE_URL` or switched to individual DB variables
- [ ] Waited for Railway redeploy to complete
- [ ] Ran `railway run php artisan optimize:clear` successfully
- [ ] Ran storage link command
- [ ] Tested application - no 500 error!

---

## If Option A (DATABASE_URL) Doesn't Work:

Use Option B - Individual variables are more reliable:

1. In Railway Variables, **DELETE**: `DATABASE_URL`
2. **ADD** these 5 variables:
   - `DB_HOST=${{Postgres.PGHOST}}`
   - `DB_PORT=${{Postgres.PGPORT}}`
   - `DB_DATABASE=${{Postgres.PGDATABASE}}`
   - `DB_USERNAME=${{Postgres.PGUSER}}`
   - `DB_PASSWORD=${{Postgres.PGPASSWORD}}`
3. Railway will redeploy automatically
4. Run `railway run php artisan migrate:status` to test connection

---

## Your Corrected Railway Variables Should Look Like:

```env
# Application
APP_NAME=WorkWise
APP_ENV=production
APP_KEY=base64:DBUZCq+YUBzF0jPtt1ZdtKPsl37dm3tOS0y6g0JfNjc=
APP_DEBUG=false
APP_URL=https://workwise-production.up.railway.app

# Database - OPTION A
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_CONNECTION=pgsql

# OR Database - OPTION B (Use if Option A fails)
# DB_CONNECTION=pgsql
# DB_HOST=${{Postgres.PGHOST}}
# DB_PORT=${{Postgres.PGPORT}}
# DB_DATABASE=${{Postgres.PGDATABASE}}
# DB_USERNAME=${{Postgres.PGUSER}}
# DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Cache & Session (Use file/database - NOT redis)
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=database

# Storage
FILESYSTEM_DISK=public

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error

# Session Config
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

# Broadcasting
BROADCAST_CONNECTION=log
```

---

**START WITH STEP 1 - Commit the code change I just made!**
