# 🚀 Fraud Detection - Quick Start (30 Minutes)

## ⚡ Enable Your Fraud Detection System NOW

You already have everything built! Let's activate it in 30 minutes.

---

## Step 1: Register the Middleware (5 minutes)

### Edit `bootstrap/app.php`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        
        // 🛡️ ADD THIS: Register fraud detection middleware
        $middleware->alias([
            'fraud.detection' => \App\Http\Middleware\FraudDetectionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

---

## Step 2: Seed Detection Rules (2 minutes)

```bash
php artisan db:seed --class=FraudDetectionRulesSeeder
```

You should see:
```
🛡️  Creating fraud detection rules...
  ✓ Created: Payment Velocity Check
  ✓ Created: High Value Transaction
  ... (14 rules)
✅ Created 14 fraud detection rules!
```

---

## Step 3: Protect Critical Routes (10 minutes)

### Edit `routes/web.php`:

Add fraud detection to payment, bid, and profile routes:

```php
// 🛡️ FRAUD-PROTECTED ROUTES
Route::middleware(['auth', 'verified', 'fraud.detection'])->group(function () {
    
    // Payment & Escrow Routes
    Route::post('/escrow/deposit', [EscrowController::class, 'deposit'])->name('escrow.deposit');
    Route::post('/escrow/release', [EscrowController::class, 'release'])->name('escrow.release');
    Route::post('/wallet/deposit', [WalletController::class, 'deposit'])->name('wallet.deposit');
    
    // Bid Routes
    Route::post('/bids', [BidController::class, 'store'])->name('bids.store');
    Route::put('/bids/{bid}', [BidController::class, 'update'])->name('bids.update');
    Route::delete('/bids/{bid}', [BidController::class, 'destroy'])->name('bids.destroy');
    
    // Profile Modification Routes
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/email', [ProfileController::class, 'updateEmail'])->name('profile.email');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Project Routes
    Route::post('/gig-jobs', [GigJobController::class, 'store'])->name('gig-jobs.store');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    
    // Contract Routes
    Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');
    Route::post('/contracts/{contract}/sign', [ContractController::class, 'sign'])->name('contracts.sign');
});
```

---

## Step 4: Test the System (10 minutes)

### Test 1: Payment Velocity Check

Open `php artisan tinker`:

```php
$user = User::find(1); // Your test user
$service = new \App\Services\FraudDetectionService();

// Analyze the user
$analysis = $service->analyzeUserFraud($user);

// View results
echo "Risk Score: " . $analysis['overall_risk_score'] . PHP_EOL;
echo "Risk Level: " . $service->determineSeverity($analysis['overall_risk_score']) . PHP_EOL;
print_r($analysis['fraud_indicators']);
```

### Test 2: Trigger a Rule

Try making 3 rapid payments (use the test account):
1. Make payment #1
2. Make payment #2 (within 5 minutes)
3. Make payment #3 (within 5 minutes)

**Expected Result:** Payment #3 should be flagged with "Additional verification required"

### Test 3: Check Fraud Stats

```php
$service = new \App\Services\FraudDetectionService();
$stats = $service->getFraudStatistics();
print_r($stats);
```

---

## Step 5: Deploy to Railway (3 minutes)

```bash
git add -A
git commit -m "Enable fraud detection system with 14 detection rules"
git push
```

Railway will automatically:
1. Deploy the changes
2. Run migrations (already done)
3. Activate fraud detection

---

## ✅ Verification Checklist

After deployment, verify these work:

### Frontend Access:
- [ ] Visit `/admin/fraud/dashboard` (as admin)
- [ ] View active alerts
- [ ] Check fraud statistics
- [ ] Review detection rules

### Middleware Active:
- [ ] Make a payment (should log activity)
- [ ] Try rapid bids (should trigger alert)
- [ ] Change email (should require verification)

### Database Populated:
- [ ] Check `fraud_detection_rules` table (14 rules)
- [ ] Check `fraud_detection_alerts` table (empty initially)
- [ ] Check `fraud_detection_cases` table (empty initially)

---

## 🎯 What You Get

With this 30-minute setup, you now have:

✅ **14 Active Fraud Detection Rules**
- Payment velocity checks
- High-value transaction alerts
- Profile modification monitoring
- Geographic anomaly detection
- Device fingerprinting
- Bid flooding prevention
- Message spam detection
- Bot detection

✅ **Real-Time Protection**
- All payments analyzed
- Profile changes monitored
- Bid submissions checked
- Suspicious activity flagged

✅ **Admin Dashboard**
- View fraud statistics
- Manage active cases
- Review alerts
- Track trends

✅ **Automated Responses**
- Block critical threats
- Require verification for high risk
- Log and monitor medium risk
- Allow normal activity

---

## 🔧 Optional Enhancements (Later)

### Add IP Geolocation (15 minutes)

```bash
composer require guzzlehttp/guzzle
```

Update `.env`:
```env
# Optional: Use ipapi.co for IP geolocation
IPAPI_ENABLED=true
```

### Enable Email Notifications (10 minutes)

Configure `config/mail.php` and add admin email notifications for high-risk alerts.

### Integrate Stripe Radar (5 minutes)

Your system already supports Stripe Radar! Just enable it in your Stripe dashboard.

---

## 📊 Monitor Your System

### Daily Tasks (5 minutes):
```bash
# Check fraud stats
php artisan tinker
>>> $service = new \App\Services\FraudDetectionService();
>>> print_r($service->getFraudStatistics());
```

### Weekly Tasks (15 minutes):
- Review false positives
- Adjust rule thresholds
- Check fraud trends

---

## 🆘 Troubleshooting

### "Middleware not found"
**Fix:** Make sure `FraudDetectionMiddleware.php` exists in `app/Http/Middleware/`

### "Rules not triggering"
**Fix:** Run the seeder:
```bash
php artisan db:seed --class=FraudDetectionRulesSeeder
```

### "Can't access fraud dashboard"
**Fix:** Make sure you're logged in as admin:
```php
$user = User::find(1);
$user->is_admin = true;
$user->save();
```

---

## 🎉 You're Done!

Your fraud detection system is now **LIVE**!

### Quick Links:
- 📊 Dashboard: `/admin/fraud/dashboard`
- 🚨 Alerts: `/admin/fraud/alerts`
- 📁 Cases: `/admin/fraud/cases`
- 📈 Analytics: `/admin/fraud/analytics`

### Documentation:
- 📖 Full Guide: `FRAUD_DETECTION_IMPLEMENTATION.md`
- 🔄 Flow Diagram: `FRAUD_DETECTION_FLOW.md`
- 🚀 This File: `FRAUD_QUICK_START.md`

---

**🛡️ Your WorkWise platform is now protected against fraud!** 🎉

*Setup time: ~30 minutes | Protection: 24/7*
