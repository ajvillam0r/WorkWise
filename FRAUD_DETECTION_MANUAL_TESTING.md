# Fraud Detection System - Manual Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the AI-powered fraud detection system in WorkWise.

## Prerequisites
- Ensure the application is running (`php artisan serve`)
- Have admin access to the fraud detection dashboard
- Test user accounts available

## Test Scenarios

### 1. Payment Fraud Detection

#### Test Case 1.1: Rapid Payment Attempts
**Objective**: Trigger fraud detection for rapid successive payments

**Steps**:
1. Login as a gig worker or employer
2. Navigate to wallet/payment section
3. Attempt to make 5+ payments within 2 minutes
4. Check if fraud alert is generated

**Expected Result**: 
- Fraud detection should flag rapid payment behavior
- Risk score should increase
- Alert should be logged in fraud detection dashboard

#### Test Case 1.2: High-Value Transaction
**Objective**: Test detection of unusually high-value transactions

**Steps**:
1. Login as a user
2. Attempt to make a payment > $1000 (or set threshold)
3. Complete the transaction
4. Check fraud detection logs

**Expected Result**:
- High-value transaction should be flagged
- AI analysis should be triggered
- Risk assessment should be recorded

### 2. Account Behavior Monitoring

#### Test Case 2.1: Profile Rapid Changes
**Objective**: Detect suspicious profile modification patterns

**Steps**:
1. Login to user account
2. Rapidly change profile information (name, email, location) multiple times
3. Save changes frequently within short time period
4. Check fraud detection alerts

**Expected Result**:
- Rapid profile changes should trigger fraud detection
- Account behavior analysis should flag suspicious activity

#### Test Case 2.2: Failed Login Attempts
**Objective**: Monitor failed authentication attempts

**Steps**:
1. Attempt to login with wrong credentials 5+ times
2. Use different IP addresses if possible
3. Check fraud detection logs

**Expected Result**:
- Failed login attempts should be tracked
- Account security alerts should be generated

### 3. Geographic Anomaly Detection

#### Test Case 3.1: Location Inconsistency
**Objective**: Detect impossible geographic transitions

**Steps**:
1. Login from one location/IP
2. Quickly login from a different geographic location (use VPN)
3. Perform transactions from both locations
4. Check geographic behavior analysis

**Expected Result**:
- Geographic anomalies should be detected
- Location-based risk factors should be calculated

### 4. Bidding Fraud Detection

#### Test Case 4.1: Bid Flooding
**Objective**: Detect suspicious bidding patterns

**Steps**:
1. Login as gig worker
2. Submit multiple bids on the same project rapidly
3. Submit bids with similar amounts
4. Check fraud detection for bid manipulation

**Expected Result**:
- Bid flooding should be detected
- Bidding behavior should be flagged as suspicious

### 5. AI-Powered Analysis Testing

#### Test Case 5.1: AI Fraud Assessment
**Objective**: Verify AI integration and analysis

**Steps**:
1. Perform any of the above suspicious activities
2. Wait for AI analysis to complete
3. Check fraud detection dashboard for AI insights
4. Verify confidence scores and fraud type classification

**Expected Result**:
- AI should provide detailed fraud analysis
- Confidence scores should be between 0-100
- Fraud types should be properly classified

## Dashboard Verification

### Admin Fraud Detection Dashboard

#### Access the Dashboard
1. Login as admin user
2. Navigate to `/admin/fraud-detection`
3. Verify dashboard loads properly

#### Dashboard Features to Test
1. **Fraud Cases Overview**
   - View all fraud cases
   - Filter by status, risk level, date
   - Sort by different criteria

2. **Real-time Alerts**
   - Check for active fraud alerts
   - Verify alert details and timestamps
   - Test alert acknowledgment

3. **Analytics and Reports**
   - View fraud statistics
   - Check risk score distributions
   - Verify AI analysis results

4. **Rule Management**
   - View active fraud detection rules
   - Test rule modification (if applicable)
   - Verify rule effectiveness metrics

## Testing Checklist

### Pre-Testing Setup
- [ ] Application is running and accessible
- [ ] Database is properly seeded with fraud detection rules
- [ ] Admin user has access to fraud detection dashboard
- [ ] Test user accounts are available

### Core Functionality Tests
- [ ] Payment fraud detection works
- [ ] Account behavior monitoring active
- [ ] Geographic anomaly detection functional
- [ ] Bidding fraud detection operational
- [ ] AI analysis integration working

### Dashboard Verification
- [ ] Admin dashboard accessible
- [ ] Fraud cases display correctly
- [ ] Real-time alerts functioning
- [ ] Analytics and reports available
- [ ] Rule management operational

### Performance Tests
- [ ] System handles multiple fraud checks simultaneously
- [ ] AI API integration doesn't cause timeouts
- [ ] Dashboard loads within acceptable time
- [ ] Fraud detection doesn't significantly impact user experience

## Troubleshooting

### Common Issues

1. **AI Analysis Not Working**
   - Check `.env` file for `META_LLAMA_L4_SCOUT_FREE` API key
   - Verify `OPENROUTER_BASE_URL` is set correctly
   - Check internet connectivity for AI API calls

2. **Dashboard Not Accessible**
   - Verify admin user permissions
   - Check route registration in `web.php`
   - Ensure fraud detection middleware is properly registered

3. **No Fraud Alerts Generated**
   - Verify fraud detection rules are seeded
   - Check middleware is applied to correct routes
   - Review fraud detection thresholds in service

4. **Database Errors**
   - Run `php artisan migrate` to ensure all tables exist
   - Run `php artisan db:seed --class=FraudDetectionRulesSeeder`
   - Check database connection and permissions

## Expected Outcomes

After completing all tests, you should observe:

1. **Fraud Detection Active**: System actively monitors and flags suspicious activities
2. **AI Integration Working**: AI provides intelligent fraud analysis and risk assessment
3. **Dashboard Functional**: Admin can monitor, manage, and analyze fraud cases
4. **Real-time Monitoring**: Fraud detection works in real-time during user activities
5. **Comprehensive Coverage**: All major fraud vectors are monitored and detected

## Next Steps

1. Monitor fraud detection in production environment
2. Fine-tune detection thresholds based on false positive rates
3. Regularly review and update fraud detection rules
4. Train staff on using the fraud detection dashboard
5. Implement additional fraud prevention measures as needed

---

**Note**: This testing should be performed in a development or staging environment before deploying to production. Always ensure you have proper backups and can restore the system if needed.