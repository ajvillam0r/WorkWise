# WorkWise Installation Guide

Complete step-by-step guide to set up and run the WorkWise platform locally.

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **PHP 8.3+** 
   - Check version: `php -v`
   - Download: [php.net/downloads](https://www.php.net/downloads)

2. **Composer** (PHP Dependency Manager)
   - Check version: `composer --version`
   - Download: [getcomposer.org](https://getcomposer.org/download/)

3. **Node.js 18+ and npm** (For frontend assets)
   - Check version: `node -v` and `npm -v`
   - Download: [nodejs.org](https://nodejs.org/)

4. **MySQL 8.0+ or MariaDB 10.3+** (Database)
   - Check version: `mysql --version`
   - Download: [mysql.com/downloads](https://dev.mysql.com/downloads/)

5. **Git** (Version Control)
   - Check version: `git --version`
   - Download: [git-scm.com/downloads](https://git-scm.com/downloads)

### Optional but Recommended

- **Laravel Herd** (macOS/Linux) or **Laragon** (Windows) - All-in-one PHP/MySQL environment
- **VS Code** or your preferred code editor
- **Postman** or **Insomnia** - For API testing

---

## Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/workwise.git

# Navigate to project directory
cd workwise
```

**Note:** Replace `your-username` with your actual GitHub username or organization name.

---

### Step 2: Install PHP Dependencies

```bash
# Install Composer dependencies
composer install
```

This will install all PHP packages defined in `composer.json`, including:
- Laravel framework
- All required packages and libraries

**Troubleshooting:**
- If you get memory limit errors: `php -d memory_limit=-1 /usr/local/bin/composer install`
- If Composer is slow: Consider using a mirror: `composer config -g repos.packagist composer https://packagist.org`

---

### Step 3: Install Node Dependencies

```bash
# Install npm packages
npm install
```

This installs all JavaScript dependencies including:
- React and React DOM
- Inertia.js
- Vite (build tool)
- Jest (testing framework)
- All frontend dependencies

**Alternative (if npm install fails):**
```bash
# Use yarn instead
yarn install

# Or use pnpm
pnpm install
```

---

### Step 4: Environment Configuration

#### 4.1 Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

#### 4.2 Generate Application Key

```bash
php artisan key:generate
```

This generates a unique encryption key for your application and adds it to `.env`.

#### 4.3 Configure Database Connection

Edit the `.env` file and update the database configuration:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=workwise
DB_USERNAME=root
DB_PASSWORD=your_password
```

**Create Database:**

```bash
# Log into MySQL
mysql -u root -p

# Create database
CREATE DATABASE workwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
EXIT;
```

#### 4.4 Configure Other Environment Variables

Update these sections in `.env` as needed:

```env
# Application
APP_NAME=WorkWise
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Mail Configuration (for development)
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@workwise.local"
MAIL_FROM_NAME="${APP_NAME}"

# Cloudflare R2 Storage (Optional - for file uploads)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=your_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_URL=https://your_domain.com
R2_REGION=auto

# Stripe (Optional - for payment processing)
STRIPE_KEY=your_stripe_key
STRIPE_SECRET=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Google OAuth (Optional - for social login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

**Note:** For local development, you can skip R2, Stripe, and Google OAuth configurations. The app will work with default local storage.

---

### Step 5: Run Database Migrations

```bash
# Run all database migrations
php artisan migrate
```

This creates all necessary database tables:
- users
- jobs
- bids
- projects
- contracts
- transactions
- messages
- reviews
- portfolio_items
- and more...

**If you want a fresh database:**
```bash
# Drop all tables and re-run migrations
php artisan migrate:fresh
```

---

### Step 6: Seed Database (Optional but Recommended)

```bash
# Run database seeders to populate with sample data
php artisan db:seed
```

This creates:
- Test users (employers, gig workers, admin)
- Sample jobs
- Sample bids
- And other test data

**Seed specific data:**
```bash
# Seed only users
php artisan db:seed --class=UserSeeder

# Seed jobs only
php artisan db:seed --class=JobSeeder
```

---

### Step 7: Create Storage Link

```bash
# Create symbolic link for storage
php artisan storage:link
```

This creates a symbolic link from `public/storage` to `storage/app/public`, allowing public access to uploaded files.

**Windows Note:** If symbolic links don't work, you may need to:
- Run PowerShell as Administrator
- Or use: `mklink /D public\storage storage\app\public`

---

### Step 8: Clear Configuration Cache

```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

---

### Step 9: Build Frontend Assets

```bash
# Build assets for production
npm run build

# Or use development mode with hot reload
npm run dev
```

**For Development:**
```bash
# Run Vite dev server (keeps running, watches for changes)
npm run dev
```

**For Production:**
```bash
# Build optimized assets
npm run build
```

---

### Step 10: Start the Development Server

Open **two terminal windows**:

#### Terminal 1: Laravel Server
```bash
php artisan serve
```

This starts Laravel on `http://localhost:8000`

#### Terminal 2: Vite Dev Server (if using `npm run dev`)
```bash
npm run dev
```

This starts Vite on `http://localhost:5173` and handles frontend hot-reloading.

**Access the Application:**
- Open your browser and navigate to: `http://localhost:8000`

---

## Quick Start Summary

Here's a condensed version for experienced developers:

```bash
# 1. Clone repository
git clone https://github.com/your-username/workwise.git
cd workwise

# 2. Install dependencies
composer install
npm install

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Configure database in .env, then:
mysql -u root -p -e "CREATE DATABASE workwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 5. Run migrations and seeders
php artisan migrate
php artisan db:seed

# 6. Create storage link
php artisan storage:link

# 7. Build assets
npm run build

# 8. Start server
php artisan serve
```

Visit `http://localhost:8000` in your browser!

---

## Default Login Credentials

After running seeders, you can login with these test accounts:

### Admin Account
- **Email:** `admin@workwise.com`
- **Password:** `password`

### Employer Account
- **Email:** `employer@test.com`
- **Password:** `password123`

### Gig Worker Account
- **Email:** `gigworker@test.com`
- **Password:** `password123`

---

## Troubleshooting

### Issue: "Class not found" or autoload errors

```bash
# Regenerate Composer autoload files
composer dump-autoload
```

### Issue: "Permission denied" errors

```bash
# Fix storage permissions (Linux/Mac)
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# On Windows, ensure your user has write permissions to storage/ and bootstrap/cache/
```

### Issue: "SQLSTATE[HY000] [2002] Connection refused"

- Check MySQL is running: `sudo service mysql status` (Linux) or check Windows Services
- Verify database credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Issue: Vite manifest not found

```bash
# Build assets first
npm run build

# Or run dev server
npm run dev
```

### Issue: Storage files not accessible

```bash
# Recreate storage link
php artisan storage:link

# Verify link exists: ls -la public/storage
```

### Issue: Composer memory limit

```bash
# Increase PHP memory limit temporarily
php -d memory_limit=512M /usr/local/bin/composer install
```

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port 8000 already in use

```bash
# Use a different port
php artisan serve --port=8080
```

### Issue: Migrations fail

```bash
# Check database connection
php artisan migrate:status

# If needed, refresh migrations
php artisan migrate:fresh
php artisan db:seed
```

---

## Development Tools

### Run Tests

```bash
# Run PHPUnit tests
php artisan test

# Run specific test file
php artisan test tests/Feature/ExampleTest.php

# Run with coverage
php artisan test --coverage
```

### Run Frontend Tests (Jest)

```bash
# Run all Jest tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Code Quality

```bash
# Format code (if using Laravel Pint)
./vendor/bin/pint

# Run static analysis (if using PHPStan)
./vendor/bin/phpstan analyse
```

### Database Management

```bash
# Check migration status
php artisan migrate:status

# Rollback last migration
php artisan migrate:rollback

# Reset all migrations
php artisan migrate:reset

# Create new migration
php artisan make:migration create_example_table

# Create new model with migration
php artisan make:model Example -m
```

---

## Production Deployment

### Build for Production

```bash
# Optimize autoloader
composer install --optimize-autoloader --no-dev

# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Build frontend assets
npm run build
```

### Environment Variables for Production

Update `.env`:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Use strong production values
APP_KEY=base64:your_generated_key
```

---

## Additional Configuration

### Mail Setup (Development)

For local email testing, you can use Mailpit or Mailtrap:

**Mailpit:**
```bash
# Install Mailpit
brew install mailpit  # macOS
# or download from: https://github.com/axllent/mailpit

# Run Mailpit
mailpit
```

Update `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
```

Access Mailpit UI at: `http://localhost:8025`

### Queue Setup (Optional)

If using queues for background jobs:

```bash
# Install Supervisor (Linux)
sudo apt-get install supervisor

# Or use Laravel Horizon
composer require laravel/horizon
php artisan horizon:install
```

### Redis Setup (Optional)

For caching and sessions:

```bash
# Install Redis
sudo apt-get install redis-server  # Linux
brew install redis  # macOS

# Start Redis
redis-server
```

Update `.env`:
```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

---

## Project Structure

```
workwise/
├── app/                    # Application core
│   ├── Http/
│   │   ├── Controllers/    # All controllers
│   │   └── Requests/       # Form request validation
│   ├── Models/             # Eloquent models
│   ├── Services/           # Business logic services
│   └── Mail/               # Email classes
├── bootstrap/              # Bootstrap files
├── config/                 # Configuration files
├── database/
│   ├── migrations/         # Database migrations
│   ├── seeders/           # Database seeders
│   └── factories/         # Model factories
├── public/                 # Public web root
├── resources/
│   ├── js/                # JavaScript/React files
│   │   ├── Components/    # React components
│   │   ├── Pages/         # Inertia pages
│   │   └── Layouts/       # Layout components
│   └── views/             # Blade templates (if any)
├── routes/
│   ├── web.php            # Web routes
│   └── auth.php           # Auth routes
├── storage/               # Storage directory
├── tests/                 # PHPUnit tests
├── vendor/                # Composer dependencies
├── .env                   # Environment variables
├── .env.example           # Example environment file
├── composer.json          # PHP dependencies
├── package.json           # Node dependencies
└── artisan                # Laravel CLI tool
```

---

## Next Steps After Installation

1. **Review Configuration**
   - Check `.env` file for all required values
   - Verify database connection

2. **Create Admin User**
   - Run seeders (creates admin automatically)
   - Or create manually via tinker: `php artisan tinker`

3. **Explore the Application**
   - Register new account
   - Complete onboarding
   - Test features

4. **Read Documentation**
   - Check `README.md` for project overview
   - Review `MANUAL_TESTING_GUIDE.md` for testing procedures
   - Check `ONBOARDING_FIXES_SUMMARY.md` for recent fixes

5. **Set Up Development Environment**
   - Configure your IDE
   - Install Laravel extensions
   - Set up debugging tools

---

## Getting Help

If you encounter issues:

1. **Check Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Clear Caches**
   ```bash
   php artisan optimize:clear
   ```

3. **Verify Installation**
   ```bash
   php artisan about
   ```

4. **Check System Requirements**
   ```bash
   php artisan about
   composer diagnose
   ```

---

## Common Commands Reference

```bash
# Application
php artisan serve              # Start development server
php artisan migrate            # Run migrations
php artisan db:seed            # Run seeders
php artisan storage:link       # Create storage symlink

# Cache
php artisan config:clear       # Clear config cache
php artisan cache:clear       # Clear application cache
php artisan route:clear        # Clear route cache
php artisan view:clear         # Clear view cache

# Testing
php artisan test               # Run tests
npm test                       # Run Jest tests
npm run test:watch             # Watch mode for tests

# Frontend
npm run dev                    # Development server with HMR
npm run build                  # Production build
npm run test:coverage          # Test coverage report

# Database
php artisan migrate:status     # Check migration status
php artisan migrate:rollback   # Rollback last migration
php artisan migrate:fresh      # Fresh migration (drops all)

# Tinker (Laravel REPL)
php artisan tinker             # Interactive shell
```

---

## Support & Contributing

- **Documentation:** See `README.md` and other `.md` files in root
- **Issues:** Report issues on GitHub Issues
- **Questions:** Check existing issues or create new one

---

**Happy Coding! 🚀**

