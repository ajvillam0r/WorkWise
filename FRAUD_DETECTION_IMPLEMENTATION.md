# 🛡️ Fraud Detection System - Implementation Guide

**WorkWise Platform**  
**Date:** October 12, 2025

---

## 📊 Current System Overview

Your WorkWise platform already has a **sophisticated fraud detection system** in place! Here's what you have:

### ✅ Already Built:

1. **Backend Services:**
   - `FraudDetectionService.php` - Comprehensive fraud analysis engine
   - `FraudDetectionMiddleware.php` - Real-time request monitoring
   - `AdminFraudController.php` - Admin management interface

2. **Database Models:**
   - `FraudDetectionCase` - Track investigation cases
   - `FraudDetectionAlert` - Real-time alerts
   - `FraudDetectionRule` - Configurable detection rules
   - `ImmutableAuditLog` - Tamper-proof logging
   - `UserBehaviorAnalytics` - Behavioral tracking

3. **Frontend Dashboard:**
   - Admin Fraud Dashboard
   - Case Management UI
   - Analytics & Reports
   - Alert Monitoring

4. **Detection Capabilities:**
   - Payment behavior analysis
   - Account behavior monitoring
   - Transaction pattern detection
   - Device fingerprinting
   - Geographic anomaly detection
   - Rate limiting & velocity checks

---

## 🚀 Implementation Steps

### Phase 1: Activate the Middleware (15 minutes)

#### Step 1.1: Register the Middleware

Edit `bootstrap/app.php` and add fraud detection middleware:

```php
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
        
        // Add fraud detection to authenticated routes
        $middleware->alias([
            'fraud.detection' => \App\Http\Middleware\FraudDetectionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

#### Step 1.2: Apply to Critical Routes

Edit `routes/web.php` to protect sensitive routes:

```php
// Protected routes with fraud detection
Route::middleware(['auth', 'fraud.detection'])->group(function () {
    // Payment routes
    Route::post('/payments/create', [PaymentController::class, 'store']);
    Route::post('/escrow/deposit', [EscrowController::class, 'deposit']);
    Route::post('/escrow/release', [EscrowController::class, 'release']);
    
    // Bid routes
    Route::post('/bids', [BidController::class, 'store']);
    Route::put('/bids/{bid}', [BidController::class, 'update']);
    
    // Profile changes
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/email', [ProfileController::class, 'updateEmail']);
    
    // Project creation
    Route::post('/projects', [ProjectController::class, 'store']);
});
```

---

### Phase 2: Configure Detection Rules (30 minutes)

#### Step 2.1: Create Initial Detection Rules

Run this via Tinker or create a seeder:

```php
use App\Models\FraudDetectionRule;

// Payment velocity rule
FraudDetectionRule::create([
    'rule_name' => 'Payment Velocity Check',
    'rule_type' => 'payment_velocity',
    'description' => 'Detect rapid successive payments',
    'parameters' => [
        'time_window' => 5, // minutes
        'max_attempts' => 3,
        'threshold_score' => 75
    ],
    'risk_score' => 75,
    'action' => 'require_verification',
    'severity' => 'high',
    'enabled' => true,
    'priority' => 1
]);

// High-value transaction rule
FraudDetectionRule::create([
    'rule_name' => 'High Value Transaction',
    'rule_type' => 'transaction_anomaly',
    'description' => 'Flag unusually large transactions',
    'parameters' => [
        'multiplier' => 3, // 3x average
        'min_amount' => 1000,
        'threshold_score' => 60
    ],
    'risk_score' => 60,
    'action' => 'manual_review',
    'severity' => 'medium',
    'enabled' => true,
    'priority' => 2
]);

// Geographic anomaly rule
FraudDetectionRule::create([
    'rule_name' => 'Geographic Anomaly',
    'rule_type' => 'location_mismatch',
    'description' => 'Detect access from unexpected locations',
    'parameters' => [
        'allowed_countries' => ['Philippines'],
        'threshold_score' => 60
    ],
    'risk_score' => 60,
    'action' => 'require_verification',
    'severity' => 'medium',
    'enabled' => true,
    'priority' => 3
]);

// Email change detection
FraudDetectionRule::create([
    'rule_name' => 'Email Change Alert',
    'rule_type' => 'profile_modification',
    'description' => 'Flag email address changes',
    'parameters' => [
        'cooldown_days' => 30,
        'threshold_score' => 85
    ],
    'risk_score' => 85,
    'action' => 'require_verification',
    'severity' => 'high',
    'enabled' => true,
    'priority' => 1
]);
```

---

### Phase 3: Enable Real-Time IP Geolocation (1 hour)

#### Step 3.1: Install IP Geolocation Service

Choose one of these services:

**Option A: ipapi.co (Free tier: 1,000 requests/day)**

```bash
composer require guzzlehttp/guzzle
```

Update `FraudDetectionService.php`:

```php
private function getIPGeolocation(string $ip): ?array
{
    try {
        $client = new \GuzzleHttp\Client();
        $response = $client->get("https://ipapi.co/{$ip}/json/");
        $data = json_decode($response->getBody(), true);
        
        return [
            'country' => $data['country_name'] ?? 'Unknown',
            'region' => $data['region'] ?? null,
            'city' => $data['city'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
        ];
    } catch (\Exception $e) {
        Log::warning('IP Geolocation failed', ['ip' => $ip, 'error' => $e->getMessage()]);
        return null;
    }
}
```

**Option B: MaxMind GeoIP2 (More accurate, paid)**

```bash
composer require geoip2/geoip2:~2.0
```

---

### Phase 4: Set Up Automated Alerts (30 minutes)

#### Step 4.1: Create Email Notification

Create `app/Notifications/FraudAlertNotification.php`:

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\FraudDetectionAlert;

class FraudAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        private FraudDetectionAlert $alert
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->error()
            ->subject("🚨 Fraud Alert: {$this->alert->severity} Risk")
            ->line("A {$this->alert->severity} risk fraud alert has been triggered.")
            ->line("**User:** {$this->alert->user->full_name}")
            ->line("**Risk Score:** {$this->alert->risk_score}/100")
            ->line("**Alert:** {$this->alert->alert_message}")
            ->action('View Alert', route('admin.fraud.alerts.show', $this->alert))
            ->line('Please review this alert as soon as possible.');
    }

    public function toArray($notifiable): array
    {
        return [
            'alert_id' => $this->alert->id,
            'user_id' => $this->alert->user_id,
            'severity' => $this->alert->severity,
            'risk_score' => $this->alert->risk_score,
            'message' => $this->alert->alert_message,
        ];
    }
}
```

#### Step 4.2: Send Alerts on Detection

Update `FraudDetectionMiddleware.php`:

```php
use App\Notifications\FraudAlertNotification;

private function handleFraudAction(array $fraudResult, Request $request): Response
{
    // ... existing code ...
    
    // Notify admins for high/critical alerts
    if ($fraudResult['risk_score'] >= 70) {
        $admins = User::where('is_admin', true)->get();
        foreach ($admins as $admin) {
            $admin->notify(new FraudAlertNotification($alert));
        }
    }
    
    // ... rest of the method ...
}
```

---

### Phase 5: Dashboard Integration (Already Done! ✅)

Your fraud detection dashboard is already built at:
- `/admin/fraud/dashboard`
- `/admin/fraud/cases`
- `/admin/fraud/alerts`
- `/admin/fraud/analytics`

Just ensure routes are registered in `routes/web.php`:

```php
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/fraud/dashboard', [AdminFraudController::class, 'dashboard'])->name('admin.fraud.dashboard');
    Route::get('/fraud/cases', [AdminFraudController::class, 'cases'])->name('admin.fraud.cases');
    Route::get('/fraud/cases/{case}', [AdminFraudController::class, 'showCase'])->name('admin.fraud.cases.show');
    Route::get('/fraud/alerts', [AdminFraudController::class, 'alerts'])->name('admin.fraud.alerts');
    Route::get('/fraud/analytics', [AdminFraudController::class, 'analytics'])->name('admin.fraud.analytics');
});
```

---

## 🎯 Advanced Features to Implement

### 1. Machine Learning Integration (Future)

```php
// Integration with Python ML model
private function getMachineLearningScore(User $user, array $features): float
{
    // Call Python microservice with user features
    $client = new \GuzzleHttp\Client();
    $response = $client->post('http://ml-service:5000/predict', [
        'json' => [
            'features' => $features
        ]
    ]);
    
    $result = json_decode($response->getBody(), true);
    return $result['fraud_probability'] * 100;
}
```

### 2. Behavioral Biometrics

Track:
- Typing speed patterns
- Mouse movement behavior
- Time between actions
- Navigation patterns

### 3. Social Network Analysis

Detect fraud rings by analyzing:
- Shared IP addresses
- Similar device fingerprints
- Connected user patterns
- Transaction networks

### 4. Stripe Radar Integration (Already available!)

```php
use Stripe\Radar\EarlyFraudWarning;

private function checkStripeRadar(string $chargeId): array
{
    $warnings = EarlyFraudWarning::all(['charge' => $chargeId]);
    return [
        'has_warnings' => count($warnings->data) > 0,
        'warnings' => $warnings->data
    ];
}
```

---

## 📋 Testing Checklist

### Test Scenarios:

#### 1. Payment Fraud
- [ ] Make 3+ payments within 5 minutes
- [ ] Submit payment 3x average amount
- [ ] Attempt payment with multiple failed cards

#### 2. Account Takeover
- [ ] Change email address rapidly
- [ ] Log in from different IPs quickly
- [ ] Change password multiple times

#### 3. Bid Manipulation
- [ ] Submit 5+ bids in 10 minutes
- [ ] Submit bid with unusual amount
- [ ] Rapid bid withdrawals

#### 4. Geographic Anomalies
- [ ] Access from VPN/Proxy
- [ ] IP location != profile location
- [ ] Rapid IP changes

---

## 🚨 Monitoring & Maintenance

### Daily Tasks:
- Review critical alerts (risk score >= 90)
- Investigate new fraud cases
- Check false positive rate

### Weekly Tasks:
- Analyze fraud trends
- Adjust detection thresholds
- Review and tune rules
- Update IP blocklists

### Monthly Tasks:
- Generate fraud analytics reports
- Review detection effectiveness
- Update ML models (if implemented)
- Conduct security audits

---

## 📊 Key Metrics to Track

1. **Detection Rate:** % of actual fraud caught
2. **False Positive Rate:** % of legitimate users flagged
3. **Response Time:** Time from detection to resolution
4. **Financial Impact:** Money saved by prevention
5. **User Impact:** Legitimate users affected

---

## 🛠️ Quick Start Commands

```bash
# Activate migrations
php artisan migrate

# Seed initial rules
php artisan db:seed --class=FraudDetectionRulesSeeder

# Test fraud detection
php artisan tinker
>>> $user = User::find(1);
>>> $service = new \App\Services\FraudDetectionService();
>>> $analysis = $service->analyzeUserFraud($user);
>>> dd($analysis);

# View fraud statistics
>>> $stats = $service->getFraudStatistics();
>>> dd($stats);
```

---

## 🎯 Recommended Configuration

### Risk Score Thresholds:

```php
0-29:   ✅ Minimal Risk - Allow
30-49:  ⚠️  Low Risk - Monitor
50-69:  🟡 Medium Risk - Enhanced monitoring
70-89:  🟠 High Risk - Require verification
90-100: 🔴 Critical Risk - Block/Suspend
```

### Action Matrix:

| Risk Level | Auto Action | Manual Review | Notification |
|-----------|-------------|---------------|--------------|
| Minimal | Allow | No | No |
| Low | Allow + Log | No | No |
| Medium | Allow + Flag | Optional | Email digest |
| High | Require Verification | Yes | Instant email |
| Critical | Block Request | Required | Instant SMS + Email |

### Manual testing – Critical risk (Score 90+)

To trigger **Critical Risk** (block with 403):

1. **Cross-request escalation (recommended):** Change your email address (triggers a high-risk alert), then within the same hour attempt 3 rapid payments. The payment request is boosted by the recent email-change alert and reaches 90+, so the request is blocked with: *"Your account is under review. Please contact support."*

2. **Single-request:** Have an account that already has 3+ payments in the last 5 minutes and a round-number payment pattern (>80% round numbers in 24h). The next payment request can trigger both velocity (75) and suspicious pattern (80); with cross-request escalation from any recent high-risk alert, the score can reach 90+.

Admin Dashboard: `/admin/fraud/dashboard` or `/admin/fraud`.

---

## 🔐 Security Best Practices

1. **Always encrypt sensitive fraud data**
2. **Use immutable audit logs** (already implemented!)
3. **Implement rate limiting** on all endpoints
4. **Regular security audits** of detection rules
5. **Keep fraud patterns confidential**
6. **Train staff** on fraud identification
7. **Regular backups** of fraud data

---

## 📞 Integration Checklist

### Before Going Live:

- [ ] Test all detection rules
- [ ] Configure email notifications
- [ ] Set up admin user accounts
- [ ] Enable middleware on critical routes
- [ ] Test false positive scenarios
- [ ] Document response procedures
- [ ] Train support team
- [ ] Set up monitoring dashboards
- [ ] Configure alert thresholds
- [ ] Test emergency suspension flow

---

## 🎉 Your System is Ready!

Your fraud detection system is **80% complete**! You just need to:

1. ✅ Register the middleware (5 minutes)
2. ✅ Create initial rules (15 minutes)
3. ✅ Test the system (30 minutes)
4. ✅ Deploy to Railway

**Total time to activate: ~1 hour**

---

## 🆘 Support & Resources

- **Fraud Dashboard:** `/admin/fraud/dashboard`
- **Documentation:** This file
- **Stripe Radar Docs:** https://stripe.com/docs/radar
- **OWASP Fraud Guide:** https://owasp.org/www-community/Fraud

---

**You have one of the most comprehensive fraud detection systems for a gig platform! 🚀**

*Last Updated: October 12, 2025*
