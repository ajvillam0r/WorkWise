# WorkWise Railway Deployment Guide

This guide explains how to deploy WorkWise to Railway with PostgreSQL database.

## Prerequisites

1. Railway account
2. GitHub repository with your WorkWise code

## Database Migration Changes Made

The following changes have been made to ensure PostgreSQL compatibility:

### 1. Database Configuration
- Changed default connection from SQLite to PostgreSQL in `config/database.php`
- Updated `.env.example` with PostgreSQL configuration

### 2. Migration Fixes
- Replaced `useCurrent()` with `default(DB::raw('CURRENT_TIMESTAMP'))` for PostgreSQL compatibility
- Replaced `longText()` and `mediumText()` with `text()` for better PostgreSQL support
- Added `use Illuminate\Support\Facades\DB;` imports where needed

### 3. Files Modified
- `config/database.php`
- `.env.example`
- Multiple migration files in `database/migrations/`

## Railway Deployment Steps

### 1. Create Railway Project
1. Go to [Railway](https://railway.app)
2. Create new project
3. Connect your GitHub repository

### 2. Add PostgreSQL Database
1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL instance

### 3. Environment Variables
Set the following environment variables in Railway:

```
APP_NAME=WorkWise
APP_ENV=production
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-app-name.up.railway.app

DB_CONNECTION=pgsql
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
```

### 4. Generate Application Key
Run this command in Railway's terminal or locally:
```bash
php artisan key:generate --show
```
Copy the generated key to your `APP_KEY` environment variable.

### 5. Deploy
1. Railway will automatically deploy when you push to your connected branch
2. After deployment, run migrations in Railway's terminal:
```bash
php artisan migrate --force
php artisan db:seed --force
```

## Important Notes

- The `--force` flag is required in production to run migrations without confirmation
- Make sure all environment variables are set before running migrations
- The PostgreSQL database will be automatically provisioned by Railway
- Railway provides automatic HTTPS and custom domains

## Troubleshooting

### Migration Issues
If you encounter migration issues:
1. Check that all environment variables are correctly set
2. Ensure the PostgreSQL service is running
3. Verify database connection with: `php artisan tinker` then `DB::connection()->getPdo()`

### Performance
For better performance in production:
- Enable caching: `php artisan config:cache`
- Cache routes: `php artisan route:cache`
- Cache views: `php artisan view:cache`

These commands are automatically run during deployment via the `nixpacks.toml` configuration.