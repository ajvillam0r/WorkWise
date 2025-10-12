# Fix Database Connection Error

## Error Detected:
```
SQLSTATE[08006] [7] could not translate host name "postgres.railway.inter"
```

## Root Cause:
Your `DATABASE_URL` or `DB_HOST` is using Railway's internal domain which isn't accessible.

## IMMEDIATE FIX - Update Railway Variables

Go to Railway Dashboard → Your Project → Variables tab

### Option A: Use DATABASE_PUBLIC_URL (Recommended)

**Change this:**
```diff
- DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
+ DATABASE_URL=${{Postgres.DATABASE_URL}}
```

OR try the full public URL:
```diff
- DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
+ DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}}
```

### Option B: Use Individual Variables (More Reliable)

**REMOVE:**
```
DATABASE_URL
```

**ADD these instead:**
```env
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_CONNECTION=pgsql
```

## After Updating Variables

Railway will redeploy. Then run:

```bash
# This should now work
railway run php artisan optimize:clear
```

## Alternative: Clear Cache Without Database

If you need to clear cache immediately before fixing the database:

```bash
# Clear config cache (doesn't need DB)
railway run rm -f bootstrap/cache/config.php

# Clear route cache (doesn't need DB)
railway run rm -f bootstrap/cache/routes-v7.php

# Clear view cache (doesn't need DB)
railway run rm -rf storage/framework/views/*

# Clear compiled cache (doesn't need DB)
railway run rm -f bootstrap/cache/packages.php
railway run rm -f bootstrap/cache/services.php
```

Then fix the database connection and redeploy.
