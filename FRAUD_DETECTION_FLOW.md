# 🛡️ Fraud Detection System - Flow Diagram

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER MAKES REQUEST                               │
│                   (Payment / Bid / Profile Change)                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRAUD DETECTION MIDDLEWARE                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  1. Capture request data (IP, device, location, amount, etc.)    │  │
│  │  2. Check user authentication                                     │  │
│  │  3. Skip check if user is admin                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRAUD ANALYSIS ENGINE                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Route-Specific Analysis:                                         │  │
│  │  • Payment → analyzePaymentRequest()                              │  │
│  │  • Profile → analyzeProfileRequest()                              │  │
│  │  • Bid     → analyzeBidRequest()                                  │  │
│  │  • Project → analyzeProjectRequest()                              │  │
│  │  • Message → analyzeMessageRequest()                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                      ┌──────────────┴──────────────┐
                      │                             │
                      ▼                             ▼
        ┌─────────────────────────┐   ┌─────────────────────────┐
        │  REAL-TIME CHECKS       │   │  HISTORICAL ANALYSIS    │
        │  ├─ Velocity limits     │   │  ├─ Payment patterns   │
        │  ├─ Amount thresholds   │   │  ├─ Account behavior   │
        │  ├─ Rate limiting       │   │  ├─ Transaction trends │
        │  ├─ IP validation       │   │  ├─ Device history     │
        │  └─ Device fingerprint  │   │  └─ Geographic patterns│
        └────────────┬────────────┘   └────────────┬────────────┘
                     │                             │
                     └──────────────┬──────────────┘
                                    ▼
              ┌───────────────────────────────────────┐
              │     CALCULATE RISK SCORE (0-100)      │
              │  ┌─────────────────────────────────┐  │
              │  │  Weighted average of:           │  │
              │  │  • Payment behavior score       │  │
              │  │  • Account behavior score       │  │
              │  │  • Transaction pattern score    │  │
              │  │  • Device behavior score        │  │
              │  │  • Geographic anomaly score     │  │
              │  └─────────────────────────────────┘  │
              └───────────────────┬───────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────┐
              │      DETERMINE ACTION BASED ON        │
              │           RISK LEVEL                  │
              └───────────────────┬───────────────────┘
                                  │
        ┌─────────────┬───────────┼───────────┬─────────────┐
        │             │           │           │             │
        ▼             ▼           ▼           ▼             ▼
   ┌────────┐   ┌─────────┐  ┌──────┐  ┌──────────┐  ┌──────────┐
   │  0-29  │   │  30-49  │  │50-69 │  │  70-89   │  │  90-100  │
   │MINIMAL │   │   LOW   │  │MEDIUM│  │   HIGH   │  │ CRITICAL │
   └────┬───┘   └────┬────┘  └───┬──┘  └────┬─────┘  └────┬─────┘
        │            │           │          │             │
        ▼            ▼           ▼          ▼             ▼
   ┌────────┐   ┌─────────┐  ┌──────┐  ┌──────────┐  ┌──────────┐
   │ ALLOW  │   │ ALLOW + │  │ALLOW+│  │ REQUIRE  │  │  BLOCK   │
   │REQUEST │   │   LOG   │  │ FLAG │  │  VERIFY  │  │ REQUEST  │
   └────┬───┘   └────┬────┘  └───┬──┘  └────┬─────┘  └────┬─────┘
        │            │           │          │             │
        │            │           ▼          │             │
        │            │      ┌────────────┐  │             │
        │            │      │CREATE ALERT│  │             │
        │            │      │(Notification)│  │             │
        │            │      └──────┬─────┘  │             │
        │            │             │        │             │
        │            ▼             ▼        ▼             ▼
        │     ┌──────────────────────────────────────────────┐
        │     │       LOG TO AUDIT TRAIL                      │
        │     │  (ImmutableAuditLog + UserBehaviorAnalytics) │
        │     └──────────────────────────────────────────────┘
        │                         │
        └─────────────────────────┼───────────────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────┐
              │     HIGH/CRITICAL RISK DETECTED?      │
              └───────────────────┬───────────────────┘
                                  │
                        ┌─────────┴─────────┐
                        │                   │
                       YES                 NO
                        │                   │
                        ▼                   ▼
        ┌───────────────────────────┐   ┌──────────────┐
        │  CREATE FRAUD CASE        │   │   CONTINUE   │
        │  ├─ Assign case ID        │   │   REQUEST    │
        │  ├─ Collect evidence      │   └──────────────┘
        │  ├─ Set status: investigating│
        │  ├─ Calculate financial impact│
        │  └─ Notify admin team     │
        └───────────────┬───────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  ADMIN FRAUD DASHBOARD        │
        │  ├─ View active cases         │
        │  ├─ Review alerts             │
        │  ├─ Investigate evidence      │
        │  ├─ Take action:              │
        │  │  • Suspend account         │
        │  │  • Request verification    │
        │  │  • Mark false positive     │
        │  │  • Resolve case            │
        │  └─ Update case notes         │
        └───────────────────────────────┘
```

---

## 🎯 Detection Rule Flow

```
USER ACTION
    │
    ▼
CHECK ACTIVE RULES (by priority)
    │
    ├─► Rule 1: Payment Velocity
    │   └─► 3+ payments in 5 min? → TRIGGERED (Score: 75)
    │
    ├─► Rule 2: High Value Transaction
    │   └─► Amount > 3x average? → TRIGGERED (Score: 60)
    │
    ├─► Rule 3: Email Change
    │   └─► Email changed? → TRIGGERED (Score: 85)
    │
    └─► ... (14 total rules)
    │
    ▼
AGGREGATE SCORES
    │
    ├─► Highest score wins
    ├─► Apply severity level
    └─► Execute associated action
    │
    ▼
TAKE ACTION
    ├─► require_verification
    ├─► manual_review
    ├─► rate_limit
    ├─► block
    ├─► monitor
    └─► allow
```

---

## 🔄 Alert Lifecycle

```
1. TRIGGER
   ↓
   Detection rule triggered
   Risk score calculated
   
2. CREATE
   ↓
   FraudDetectionAlert created
   Status: active
   Severity: low/medium/high/critical
   
3. NOTIFY
   ↓
   Email sent to admins (if high/critical)
   Dashboard notification
   SMS (if critical)
   
4. REVIEW
   ↓
   Admin views alert
   Reviews evidence
   Investigates user activity
   
5. RESOLVE
   ↓
   Action taken:
   • Confirmed fraud → Create case
   • False positive → Mark & dismiss
   • Suspicious → Continue monitoring
   • Resolved → Close alert
```

---

## 🎨 Risk Score Calculation

```
Payment Behavior (0-100)
   ├─ Velocity: 40 points
   ├─ Amount anomaly: 30 points
   └─ Failed attempts: 25 points
        │
        ▼
Account Behavior (0-100)
   ├─ Profile changes: 35 points
   ├─ Email changes: 50 points
   └─ Password resets: 30 points
        │
        ▼
Transaction Patterns (0-100)
   ├─ Amount anomaly: 45 points
   └─ Round numbers: 25 points
        │
        ▼
Device Behavior (0-100)
   ├─ Multiple fingerprints: 40 points
   └─ User agent changes: 30 points
        │
        ▼
Geographic Behavior (0-100)
   ├─ Location mismatch: 60 points
   └─ IP changes: 35 points
        │
        └────────────► WEIGHTED AVERAGE
                            │
                            ▼
                    OVERALL RISK SCORE
                        (0-100)
                            │
                            ▼
                 ┌──────────┴──────────┐
                 │                     │
         0-29: Minimal          90-100: Critical
         30-49: Low            ┌────────┴────────┐
         50-69: Medium         │                 │
         70-89: High       SUSPEND           BLOCK
                           ACCOUNT          REQUEST
```

---

## 🚨 Response Matrix

```
┌──────────────┬─────────────┬────────────────┬─────────────────┐
│ RISK LEVEL   │ AUTO ACTION │ ADMIN NOTIFIED │ USER EXPERIENCE │
├──────────────┼─────────────┼────────────────┼─────────────────┤
│ Minimal      │ Allow       │ No             │ Normal          │
│ (0-29)       │             │                │                 │
├──────────────┼─────────────┼────────────────┼─────────────────┤
│ Low          │ Allow + Log │ No             │ Normal          │
│ (30-49)      │             │                │                 │
├──────────────┼─────────────┼────────────────┼─────────────────┤
│ Medium       │ Flag + Log  │ Email (digest) │ Slight delay    │
│ (50-69)      │             │                │                 │
├──────────────┼─────────────┼────────────────┼─────────────────┤
│ High         │ Verify ID   │ Instant email  │ Extra step      │
│ (70-89)      │             │                │ required        │
├──────────────┼─────────────┼────────────────┼─────────────────┤
│ Critical     │ Block       │ Email + SMS    │ Request blocked │
│ (90-100)     │             │                │ Account review  │
└──────────────┴─────────────┴────────────────┴─────────────────┘
```

---

## 📊 Data Flow

```
REQUEST DATA
    ├─► IP Address
    ├─► User Agent
    ├─► Device Fingerprint
    ├─► Request payload
    ├─► Timestamp
    └─► Session data
        │
        ▼
FRAUD DETECTION SERVICE
        │
        ├─► Database queries
        │   ├─ User history
        │   ├─ Transaction patterns
        │   └─ Audit logs
        │
        ├─► External services
        │   ├─ IP geolocation
        │   ├─ Stripe Radar (optional)
        │   └─ ML model (future)
        │
        └─► Cache
            ├─ User risk scores
            └─ Detection results
        │
        ▼
DECISION ENGINE
        │
        ├─► Allow request ────────────► Continue
        ├─► Require verification ──────► Extra step
        └─► Block request ────────────► Error 403
        │
        ▼
LOGGING & ANALYTICS
        ├─► ImmutableAuditLog
        ├─► UserBehaviorAnalytics
        ├─► FraudDetectionAlert
        └─► FraudDetectionCase (if needed)
```

---

## 🎯 Quick Reference

### Risk Scores:
- **0-29:** ✅ Minimal - Normal operation
- **30-49:** ⚠️ Low - Enhanced logging
- **50-69:** 🟡 Medium - Flagged for review
- **70-89:** 🟠 High - Verification required
- **90-100:** 🔴 Critical - Request blocked

### Actions:
- **allow** - Process normally
- **monitor** - Log and continue
- **rate_limit** - Slow down requests
- **require_verification** - Extra identity check
- **manual_review** - Admin must review
- **block** - Deny request immediately

### Severities:
- **low** - Informational
- **medium** - Should review
- **high** - Urgent review
- **critical** - Immediate action

---

**This visual guide helps you understand how the fraud detection system works end-to-end!** 🚀
