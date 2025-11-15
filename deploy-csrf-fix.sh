#!/bin/bash

# ID Verification CSRF Fix Deployment Script
# This script helps deploy the CSRF token fix to Railway

echo "=========================================="
echo "ID Verification CSRF Fix Deployment"
echo "=========================================="
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📋 Step 1: Checking modified files..."
git status --short

echo ""
echo "📝 Step 2: Staging changes..."
git add resources/js/Pages/IdVerification/Upload.jsx
git add config/sanctum.php
git add ID_VERIFICATION_CSRF_FIX_RAILWAY.md
git add deploy-csrf-fix.sh

echo ""
echo "✅ Files staged for commit"
echo ""

echo "💬 Step 3: Committing changes..."
git commit -m "Fix: CSRF token mismatch on ID verification uploads

- Add CSRF token refresh before uploads
- Add credentials: 'same-origin' to fetch requests
- Publish Sanctum configuration
- Add comprehensive deployment guide"

echo ""
echo "✅ Changes committed"
echo ""

echo "🚀 Step 4: Ready to push to Railway"
echo ""
echo "⚠️  IMPORTANT: Before pushing, ensure you've set these Railway environment variables:"
echo ""
echo "Required Environment Variables:"
echo "  SESSION_DOMAIN=.your-railway-domain.up.railway.app"
echo "  SANCTUM_STATEFUL_DOMAINS=your-railway-domain.up.railway.app"
echo "  SESSION_LIFETIME=480"
echo "  SESSION_SECURE_COOKIE=true"
echo "  APP_URL=https://your-railway-domain.up.railway.app"
echo ""
echo "Replace 'your-railway-domain' with your actual Railway domain"
echo ""

read -p "Have you set the environment variables in Railway? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Pushing to Railway..."
    git push origin main
    
    echo ""
    echo "✅ Deployment initiated!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Wait for Railway deployment to complete"
    echo "2. Run these commands in Railway shell:"
    echo "   php artisan config:clear"
    echo "   php artisan cache:clear"
    echo "   php artisan route:clear"
    echo "3. Test ID verification upload at /id-verification"
    echo ""
    echo "📖 For detailed instructions, see: ID_VERIFICATION_CSRF_FIX_RAILWAY.md"
else
    echo ""
    echo "⏸️  Deployment paused"
    echo "Please set the environment variables in Railway first"
    echo "Then run: git push origin main"
fi

echo ""
echo "=========================================="
echo "Deployment script completed"
echo "=========================================="
