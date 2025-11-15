#!/bin/bash

# Railway Deployment Script for 419 Error Fix
# This script helps deploy the 419 error fix to Railway

echo "=========================================="
echo "Railway 419 Error Fix Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Verify local changes
echo "Step 1: Verifying local changes..."
if [ -f "resources/js/utils/csrfRefresh.js" ]; then
    print_success "CSRF refresh utility found"
else
    print_error "CSRF refresh utility not found!"
    exit 1
fi

if grep -q "startCsrfRefresh" "resources/js/Pages/Onboarding/EmployerOnboarding.jsx"; then
    print_success "EmployerOnboarding component updated"
else
    print_error "EmployerOnboarding component not updated!"
    exit 1
fi

if grep -q "startCsrfRefresh" "resources/js/Pages/Onboarding/GigWorkerOnboarding.jsx"; then
    print_success "GigWorkerOnboarding component updated"
else
    print_error "GigWorkerOnboarding component not updated!"
    exit 1
fi

echo ""

# Step 2: Build assets
echo "Step 2: Building production assets..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Assets built successfully"
else
    print_error "Asset build failed!"
    exit 1
fi

echo ""

# Step 3: Commit changes
echo "Step 3: Committing changes..."
git add .
git commit -m "Fix 419 Page Expired error for Railway deployment

- Extended session lifetime to 480 minutes
- Added CSRF token auto-refresh utility
- Updated onboarding components with CSRF refresh
- Configured for Railway proxy environment
- Added comprehensive documentation"

if [ $? -eq 0 ]; then
    print_success "Changes committed"
else
    print_warning "No changes to commit or commit failed"
fi

echo ""

# Step 4: Push to repository
echo "Step 4: Pushing to repository..."
read -p "Push to main branch? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    if [ $? -eq 0 ]; then
        print_success "Pushed to repository"
        print_warning "Railway will automatically deploy..."
    else
        print_error "Push failed!"
        exit 1
    fi
else
    print_warning "Skipped push to repository"
fi

echo ""

# Step 5: Environment variables reminder
echo "Step 5: Railway Environment Variables"
echo "=========================================="
echo "Make sure these are set in Railway dashboard:"
echo ""
echo "SESSION_LIFETIME=480"
echo "SESSION_SECURE_COOKIE=true"
echo "SESSION_DOMAIN=.your-app.up.railway.app"
echo "APP_URL=https://your-app.up.railway.app"
echo "SANCTUM_STATEFUL_DOMAINS=your-app.up.railway.app"
echo ""
read -p "Have you set these variables in Railway? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please set these variables in Railway dashboard before testing"
fi

echo ""

# Step 6: Post-deployment commands
echo "Step 6: Post-Deployment Commands"
echo "=========================================="
echo "After Railway finishes deploying, run these commands:"
echo ""
echo "railway run php artisan config:clear"
echo "railway run php artisan cache:clear"
echo "railway run php artisan route:clear"
echo "railway run php artisan view:clear"
echo ""
read -p "Open Railway CLI to run these commands? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening Railway CLI..."
    railway run bash
fi

echo ""

# Step 7: Testing instructions
echo "Step 7: Testing"
echo "=========================================="
echo "To test the fix:"
echo ""
echo "1. Navigate to: https://your-app.up.railway.app/onboarding/employer"
echo "2. Open browser console (F12)"
echo "3. Look for: 'CSRF token refresh started (every 30 minutes)'"
echo "4. Fill out and submit the form"
echo "5. Should work without 419 error"
echo ""
echo "Monitor logs with: railway logs"
echo ""

print_success "Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Wait for Railway to finish deploying"
echo "2. Run post-deployment commands"
echo "3. Test the onboarding flow"
echo "4. Monitor logs for any issues"
echo ""
echo "Documentation:"
echo "- RAILWAY_419_FIX_DEPLOYMENT.md - Detailed Railway guide"
echo "- ONBOARDING_419_ERROR_FIX.md - Technical documentation"
echo "- HOW_TO_TEST_419_FIX.md - Testing guide"
echo ""
