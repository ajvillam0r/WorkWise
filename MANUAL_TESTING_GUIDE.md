# WorkWise Manual Testing Guide

## Document Overview

This comprehensive guide provides manual testing procedures for all modules in the WorkWise platform based on the Combined_Unit_Testing_Table.xlsx. It includes specific page URLs, user roles, testing steps, and automated test commands.

**Total Test Cases:** 109 (CASE-001 to CASE-109)
**Last Updated:** November 2, 2025

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [User Accounts for Testing](#user-accounts-for-testing)
3. [Manual Testing by Module](#manual-testing-by-module)
   - [Account Management](#1-account-management)
   - [Job Management](#2-job-management)
   - [Bidding Module](#3-bidding-module)
   - [Contract and Payment Management](#4-contract-and-payment-management)
   - [Review and Messaging](#5-review-and-messaging)
   - [Admin Operations](#6-admin-operations)
   - [Advanced Features](#7-advanced-features)
4. [Automated Testing Commands](#automated-testing-commands)

---

## Module Overview

The WorkWise platform consists of 14 distinct modules with comprehensive test coverage:

| Module | Test Cases | User Roles | Priority |
|--------|------------|------------|----------|
| Account Management | 32 cases | All users | Critical |
| Job Management | 21 cases | Employer, Gig Worker | Critical |
| Bidding Module | 12 cases | Gig Worker, Employer | Critical |
| Contract & Payment | 12 cases | All users | Critical |
| Review & Messaging | 9 cases | All users | High |
| Admin Operations | 38 cases | Admin | Critical |
| AI Matching | 1 case | System | Medium |
| Profile Management | 4 cases | All users | High |
| Database Integrity | 1 case | System | High |
| Notifications | 1 case | All users | Medium |
| Payment Integration | 1 case | System | High |
| Performance | 1 case | System | Medium |
| Validation | 2 cases | System | Medium |
| Data Sanitization | 1 case | System | Medium |

---

## User Accounts for Testing

### Required Test Users

Create the following test accounts before manual testing:

#### 1. Employer Account
- **Email:** employer@test.com
- **Password:** password123
- **User Type:** employer
- **Access:** Job posting, bid management, contracts, payments

#### 2. Gig Worker Account
- **Email:** gigworker@test.com
- **Password:** password123
- **User Type:** gig_worker
- **Access:** Job browsing, bid submission, contracts

#### 3. Admin Account
- **Email:** admin@test.com
- **Password:** password123
- **User Type:** admin
- **Is Admin:** true
- **Access:** All admin operations, user management, fraud detection

---

## Manual Testing by Module

## 1. Account Management

### Module Information
- **Test Cases:** CASE-001 to CASE-009, CASE-043 to CASE-046, CASE-052 to CASE-054, CASE-067, CASE-069
- **User Roles:** All users
- **Total Tests:** 20

---

### 1.1 Login (CASE-001 to CASE-003)

#### **Test URLs:**
- Login Page: `http://localhost/login`
- Route: `Route::get('/login')` (from auth.php)

#### **CASE-001: User enters invalid input**

**Steps:**
1. Navigate to `/login`
2. Enter invalid email: `invalid-email` (no @ symbol)
3. Enter password: `password123`
4. Click "Log in" button

**Expected Result:** 
- Validation error message: "The email must be a valid email address"
- Form not submitted
- User remains on login page

**User Type:** Any (unauthenticated)

---

#### **CASE-002: User leaves required field empty**

**Steps:**
1. Navigate to `/login`
2. Leave email field empty
3. Leave password field empty
4. Click "Log in" button

**Expected Result:** 
- Validation error messages for both fields
- "The email field is required"
- "The password field is required"
- Form not submitted

**User Type:** Any (unauthenticated)

---

#### **CASE-003: User enters valid data**

**Steps:**
1. Navigate to `/login`
2. Enter email: `employer@test.com`
3. Enter password: `password123`
4. Click "Log in" button

**Expected Result:** 
- User successfully authenticated
- Redirected to appropriate dashboard based on user type
- Employer → `/employer/dashboard`
- Gig Worker → `/gig-worker/dashboard`
- Admin → `/admin/dashboard`

**User Type:** Any (unauthenticated)

---

### 1.2 Registration (CASE-004 to CASE-006)

#### **Test URLs:**
- Registration Page: `http://localhost/register`
- Route: `Route::get('/register')` (from auth.php)

#### **CASE-004: User enters invalid input**

**Steps:**
1. Navigate to `/register`
2. Enter first name: `John`
3. Enter last name: `Doe`
4. Enter invalid email: `not-an-email`
5. Enter password: `123` (too short)
6. Enter password confirmation: `123`
7. Select user type: `employer`
8. Click "Register" button

**Expected Result:** 
- Validation errors displayed
- "The email must be a valid email address"
- "The password must be at least 8 characters"
- Form not submitted

**User Type:** Any (unauthenticated)

---

#### **CASE-005: User leaves required field empty**

**Steps:**
1. Navigate to `/register`
2. Leave first name empty
3. Leave last name empty
4. Leave email empty
5. Leave password empty
6. Leave user type unselected
7. Click "Register" button

**Expected Result:** 
- Multiple validation error messages
- All required fields flagged
- Form not submitted

**User Type:** Any (unauthenticated)

---

#### **CASE-006: User enters valid data**

**Steps:**
1. Navigate to `/register`
2. Enter first name: `Jane`
3. Enter last name: `Smith`
4. Enter email: `jane.smith@test.com`
5. Enter password: `password123`
6. Confirm password: `password123`
7. Select user type: `gig_worker`
8. Click "Register" button

**Expected Result:** 
- User account created successfully
- Email verification notification sent
- Redirected to dashboard or email verification page
- User can log in with credentials

**User Type:** Any (unauthenticated)

---

### 1.3 Profile Update (CASE-007 to CASE-009, CASE-044 to CASE-046)

#### **Test URLs:**
- Profile Edit Page: `http://localhost/profile`
- Route: `Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit')`

#### **CASE-007: User enters invalid input**

**Steps:**
1. Log in as any user
2. Navigate to `/profile`
3. Enter invalid email: `bad-email-format`
4. Click "Save" button

**Expected Result:** 
- Validation error: "The email must be a valid email address"
- Profile not updated
- User remains on profile page

**User Type:** Any (authenticated)

---

#### **CASE-008: User leaves required field empty**

**Steps:**
1. Log in as any user
2. Navigate to `/profile`
3. Clear first name field (leave empty)
4. Click "Save" button

**Expected Result:** 
- Validation error: "The first name field is required"
- Profile not updated

**User Type:** Any (authenticated)

---

#### **CASE-009: User enters valid data**

**Steps:**
1. Log in as any user
2. Navigate to `/profile`
3. Update first name: `UpdatedName`
4. Update last name: `NewLastName`
5. Update email: `updated.email@test.com`
6. Click "Save" button

**Expected Result:** 
- Success message: "Profile updated successfully"
- Changes saved to database
- Updated information displayed

**User Type:** Any (authenticated)

---

#### **CASE-044: Profile email is lowercased automatically**

**Steps:**
1. Log in as any user
2. Navigate to `/profile`
3. Enter email with mixed case: `Test.User@EXAMPLE.com`
4. Click "Save" button

**Expected Result:** 
- Email saved as lowercase: `test.user@example.com`
- Profile updated successfully

**User Type:** Any (authenticated)

---

#### **CASE-045: Email must be unique across users**

**Steps:**
1. Log in as gig worker
2. Navigate to `/profile`
3. Try to change email to existing employer email: `employer@test.com`
4. Click "Save" button

**Expected Result:** 
- Validation error: "The email has already been taken"
- Profile not updated

**User Type:** Any (authenticated)

---

#### **CASE-046: Profile picture max size validation (5MB)**

**Steps:**
1. Log in as any user
2. Navigate to `/profile`
3. Attempt to upload profile picture larger than 5MB
4. Click "Save" button

**Expected Result:** 
- Validation error: "The profile picture must not be greater than 5120 kilobytes"
- Image not uploaded

**User Type:** Any (authenticated)

---

### 1.4 Login Security (CASE-043, CASE-052 to CASE-054)

#### **CASE-043: LoginRequest validates email and password format**

**Steps:**
1. Navigate to `/login`
2. Enter malformed email: `user@` (incomplete)
3. Enter empty password
4. Click "Log in" button

**Expected Result:** 
- Email validation error displayed
- Password required error displayed
- Login prevented

**User Type:** Any (unauthenticated)

---

#### **CASE-052: Rate limiting locks after 5 failed attempts**

**Steps:**
1. Navigate to `/login`
2. Enter email: `test@test.com`
3. Enter wrong password: `wrongpass123`
4. Click "Log in" button
5. Repeat steps 2-4 five times

**Expected Result:** 
- After 5th failed attempt: "Too many login attempts. Please try again in X seconds"
- Account temporarily locked
- Login form disabled temporarily

**User Type:** Any (unauthenticated)

---

#### **CASE-053: Rate limit cleared after successful login**

**Steps:**
1. After rate limiting is active
2. Wait for rate limit cooldown (60 seconds)
3. Enter correct credentials
4. Click "Log in" button

**Expected Result:** 
- Rate limit counter reset
- Successful login
- Redirected to dashboard

**User Type:** Any (unauthenticated)

---

#### **CASE-054: Remember-me sets recaller cookie**

**Steps:**
1. Navigate to `/login`
2. Enter email: `employer@test.com`
3. Enter password: `password123`
4. Check "Remember me" checkbox
5. Click "Log in" button
6. Close browser
7. Reopen browser and navigate to site

**Expected Result:** 
- User remains logged in after browser restart
- `remember_web` cookie set
- Session persists

**User Type:** Any (unauthenticated)

---

#### **CASE-067: Google OAuth redirect endpoint protected**

**Steps:**
1. Navigate to OAuth redirect endpoint (typically `/auth/google/callback`)
2. Attempt to access without proper OAuth state

**Expected Result:** 
- Request validated for CSRF token
- Invalid requests rejected
- Only valid OAuth callbacks accepted

**User Type:** Any (unauthenticated)

---

#### **CASE-069: Email validation accepts mixed case**

**Steps:**
1. Navigate to `/login`
2. Enter email with mixed case: `Test.User@Example.COM`
3. Enter correct password
4. Click "Log in" button

**Expected Result:** 
- Login successful
- Email case-insensitive validation
- User authenticated

**User Type:** Any (unauthenticated)

---

## 2. Job Management

### Module Information
- **Test Cases:** CASE-010 to CASE-018, CASE-047 to CASE-049, CASE-055
- **User Roles:** Employer (create/edit), Gig Worker (view)
- **Total Tests:** 13

---

### 2.1 Post Job (CASE-010 to CASE-012, CASE-047 to CASE-049, CASE-055)

#### **Test URLs:**
- Create Job Page: `http://localhost/jobs/create`
- Route: `Route::get('/jobs/create', [GigJobController::class, 'create'])->name('jobs.create')`
- Middleware: `employer` (employer only)

#### **CASE-010: User enters invalid input**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/create`
3. Enter title: `A` (too short)
4. Enter description: `Short` (less than 100 characters)
5. Enter budget: `-10` (negative value)
6. Click "Post Job" button

**Expected Result:** 
- Validation errors displayed
- "The title must be at least 3 characters"
- "The description must be at least 100 characters"
- "The budget must be at least 5"
- Job not created

**User Type:** Employer

---

#### **CASE-011: User leaves required field empty**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/create`
3. Leave title empty
4. Leave description empty
5. Leave budget empty
6. Click "Post Job" button

**Expected Result:** 
- Validation errors for required fields
- "The title field is required"
- "The description field is required"
- "The budget field is required"
- Job not created

**User Type:** Employer

---

#### **CASE-012: User enters valid data**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/create`
3. Enter title: `Full-Stack Developer Needed`
4. Enter description: (at least 100 characters) 
   `We are looking for an experienced full-stack developer to build a web application using Laravel and React. The project requires expertise in API development, database design, and frontend optimization.`
5. Enter budget: `500`
6. Select category: `Web Development`
7. Add required skills: `PHP`, `Laravel`, `React`
8. Click "Post Job" button

**Expected Result:** 
- Success message: "Job posted successfully"
- Job created in database
- Redirected to job details page `/jobs/{id}`
- Job visible in job listings

**User Type:** Employer

---

#### **CASE-047: Description minimum 100 chars boundary test**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/create`
3. Enter title: `Test Job`
4. Enter description with exactly 100 characters
5. Enter budget: `100`
6. Click "Post Job" button

**Expected Result:** 
- Job created successfully
- Boundary validation passes at exactly 100 characters
- No validation errors

**User Type:** Employer

---

#### **CASE-048: Budget minimum boundary test (min:5)**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/create`
3. Enter valid title and description
4. Enter budget: `5` (minimum allowed)
5. Click "Post Job" button

**Expected Result:** 
- Job created successfully
- Budget validation passes at minimum value
- No validation errors

**User Type:** Employer

---

#### **CASE-049: Skills_requirements auto-generated from required_skills**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/create`
3. Enter valid job details
4. Add required skills without manually specifying experience levels
5. Click "Post Job" button

**Expected Result:** 
- `skills_requirements` array automatically generated
- Each skill assigned default experience level from job's experience_level
- All skills marked as "required" importance
- Job created successfully

**User Type:** Employer

---

#### **CASE-055: Only employers can create jobs**

**Steps:**
1. Log in as gig worker
2. Attempt to navigate to `/jobs/create`

**Expected Result:** 
- Access denied (403 Forbidden)
- Gig worker redirected or shown error
- Cannot access job creation page

**User Type:** Gig Worker (negative test)

---

### 2.2 Edit Job (CASE-013 to CASE-015)

#### **Test URLs:**
- Edit Job Page: `http://localhost/jobs/{job}/edit`
- Route: `Route::get('/jobs/{job}/edit', [GigJobController::class, 'edit'])->name('jobs.edit')`
- Middleware: `employer`

#### **CASE-013: User enters invalid input**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/{existing_job_id}/edit`
3. Change budget to: `-100` (negative)
4. Click "Update Job" button

**Expected Result:** 
- Validation error: "The budget must be at least 5"
- Job not updated

**User Type:** Employer

---

#### **CASE-014: User leaves required field empty**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/{existing_job_id}/edit`
3. Clear title field
4. Click "Update Job" button

**Expected Result:** 
- Validation error: "The title field is required"
- Job not updated

**User Type:** Employer

---

#### **CASE-015: User enters valid data**

**Steps:**
1. Log in as employer
2. Navigate to `/jobs/{existing_job_id}/edit`
3. Update title: `Updated Job Title`
4. Update description: `Updated job description with more than 100 characters to meet validation requirements.`
5. Update budget: `750`
6. Click "Update Job" button

**Expected Result:** 
- Success message: "Job updated successfully"
- Changes saved to database
- Redirected to job details page
- Updated information displayed

**User Type:** Employer

---

### 2.3 View Job Listings (CASE-016 to CASE-018)

#### **Test URLs:**
- Job Listings Page: `http://localhost/jobs`
- Route: `Route::get('/jobs', [GigJobController::class, 'index'])->name('jobs.index')`

#### **CASE-016: User enters invalid input**

**Steps:**
1. Log in as any user
2. Navigate to `/jobs`
3. Enter invalid search query or filter
4. Apply filters

**Expected Result:** 
- No results shown or validation error
- Graceful error handling
- No application errors

**User Type:** Any (authenticated)

---

#### **CASE-017: User leaves required field empty**

**Steps:**
1. Log in as any user
2. Navigate to `/jobs`
3. Apply filters without entering any criteria
4. Submit empty search

**Expected Result:** 
- All jobs displayed (no filtering)
- Default view shown
- No errors

**User Type:** Any (authenticated)

---

#### **CASE-018: User enters valid data**

**Steps:**
1. Log in as any user
2. Navigate to `/jobs`
3. Enter search keyword: `Developer`
4. Select category: `Web Development`
5. Set budget range: `100-1000`
6. Click "Search" or apply filters

**Expected Result:** 
- Filtered job results displayed
- Only matching jobs shown
- Pagination works correctly
- Filter criteria maintained

**User Type:** Any (authenticated)

---

## 3. Bidding Module

### Module Information
- **Test Cases:** CASE-019 to CASE-024, CASE-050 to CASE-051, CASE-056 to CASE-057
- **User Roles:** Gig Worker (submit), Employer (manage)
- **Total Tests:** 10

---

### 3.1 Submit Bid (CASE-019 to CASE-021, CASE-050 to CASE-051)

#### **Test URLs:**
- Job Details Page (to submit bid): `http://localhost/jobs/{job}`
- Route: `Route::post('/bids', [BidController::class, 'store'])->name('bids.store')`
- Middleware: `gig_worker`

#### **CASE-019: User enters invalid input**

**Steps:**
1. Log in as gig worker
2. Navigate to `/jobs/{job_id}`
3. Enter bid amount: `-50` (negative)
4. Enter proposal: `Too short` (less than 50 characters)
5. Click "Submit Bid" button

**Expected Result:** 
- Validation errors displayed
- "The bid amount must be at least 1"
- "The proposal message must be at least 50 characters"
- Bid not created

**User Type:** Gig Worker

---

#### **CASE-020: User leaves required field empty**

**Steps:**
1. Log in as gig worker
2. Navigate to `/jobs/{job_id}`
3. Leave bid amount empty
4. Leave proposal message empty
5. Click "Submit Bid" button

**Expected Result:** 
- Validation errors for required fields
- "The bid amount field is required"
- "The proposal message field is required"
- Bid not created

**User Type:** Gig Worker

---

#### **CASE-021: User enters valid data**

**Steps:**
1. Log in as gig worker
2. Navigate to `/jobs/{job_id}`
3. Enter bid amount: `400`
4. Enter proposal message: (at least 50 characters)
   `I have 5 years of experience in web development and can complete this project within 2 weeks.`
5. Set estimated delivery: `14 days`
6. Click "Submit Bid" button

**Expected Result:** 
- Success message: "Bid submitted successfully"
- Bid created in database
- Employer notified of new bid
- Bid visible in employer's bid management

**User Type:** Gig Worker

---

#### **CASE-050: Proposal message minimum 50 chars boundary**

**Steps:**
1. Log in as gig worker
2. Navigate to `/jobs/{job_id}`
3. Enter bid amount: `300`
4. Enter proposal with exactly 50 characters
5. Click "Submit Bid" button

**Expected Result:** 
- Bid submitted successfully
- Boundary validation passes at exactly 50 characters
- No validation errors

**User Type:** Gig Worker

---

#### **CASE-051: Proposal message under 50 chars rejected**

**Steps:**
1. Log in as gig worker
2. Navigate to `/jobs/{job_id}`
3. Enter bid amount: `300`
4. Enter proposal with 49 characters (one char under limit)
5. Click "Submit Bid" button

**Expected Result:** 
- Validation error: "The proposal message must be at least 50 characters"
- Bid not created

**User Type:** Gig Worker

---

### 3.2 Manage Proposals (CASE-022 to CASE-024, CASE-056)

#### **Test URLs:**
- Bid Management Page: `http://localhost/bids`
- View Bid Details: `http://localhost/bids/{bid}`
- Route: `Route::patch('/bids/{bid}', [BidController::class, 'update'])->name('bids.update')`
- Middleware: `employer`

#### **CASE-022: User enters invalid input**

**Steps:**
1. Log in as employer
2. Navigate to `/bids`
3. Select a bid to review
4. Attempt to accept with insufficient escrow balance
5. Click "Accept Bid" button

**Expected Result:** 
- Error message: "Insufficient escrow balance"
- Bid not accepted
- User prompted to add funds

**User Type:** Employer

---

#### **CASE-023: User leaves required field empty**

**Steps:**
1. Log in as employer
2. Navigate to `/bids/{bid_id}`
3. Attempt to update bid status without selecting action
4. Click "Update" button

**Expected Result:** 
- Validation error or no action taken
- Bid status unchanged

**User Type:** Employer

---

#### **CASE-024: User enters valid data**

**Steps:**
1. Log in as employer with sufficient escrow balance
2. Navigate to `/bids`
3. Select a bid to review
4. Review bid details
5. Click "Accept Bid" button
6. Confirm acceptance

**Expected Result:** 
- Success message: "Bid accepted successfully"
- Contract created automatically
- Project initiated
- Gig worker notified
- Funds moved to escrow
- Redirected to contract page

**User Type:** Employer

---

#### **CASE-056: Only job owner can accept/reject bids**

**Steps:**
1. Log in as employer A
2. Create a job
3. Log out and log in as employer B (different employer)
4. Attempt to navigate to bids for employer A's job
5. Try to accept/reject bid

**Expected Result:** 
- Access denied (403 Forbidden)
- Cannot modify other employer's bids
- Only job owner has permission

**User Type:** Employer (different from job owner)

---

#### **CASE-057: Bid visibility restricted to owner and worker**

**Steps:**
1. Gig worker A submits bid on a job
2. Log out and log in as gig worker B
3. Attempt to view gig worker A's bid at `/bids/{bid_id}`

**Expected Result:** 
- Access denied (403 Forbidden)
- Bid details not visible to other gig workers
- Only bid owner and job owner can view

**User Type:** Gig Worker (not bid owner)

---

## 4. Contract and Payment Management

### Module Information
- **Test Cases:** CASE-025 to CASE-033, CASE-061 to CASE-062
- **User Roles:** Employer, Gig Worker
- **Total Tests:** 12

---

### 4.1 Create Contract (CASE-025 to CASE-027, CASE-061 to CASE-062)

#### **Test URLs:**
- Contracts Page: `http://localhost/contracts`
- Contract Details: `http://localhost/contracts/{contract}`
- Route: Contracts created automatically when bid accepted

#### **CASE-025: User enters invalid input**

**Steps:**
1. Log in as employer
2. Attempt to accept bid with invalid contract terms
3. Submit with malformed data

**Expected Result:** 
- Validation errors displayed
- Contract not created
- Bid acceptance prevented

**User Type:** Employer

---

#### **CASE-026: User leaves required field empty**

**Steps:**
1. Log in as employer
2. Accept bid but contract creation fails due to missing data
3. Attempt to proceed

**Expected Result:** 
- Error message about missing contract data
- Contract not created
- User prompted to complete information

**User Type:** Employer

---

#### **CASE-027: User enters valid data**

**Steps:**
1. Log in as employer with sufficient escrow
2. Navigate to `/bids`
3. Accept a valid bid
4. Contract automatically created

**Expected Result:** 
- Success message: "Contract created successfully"
- Contract generated with all details
- Both parties notified
- Contract ready for signing
- Redirected to contract page

**User Type:** Employer

---

#### **CASE-061: Accepting bid creates project, transaction, contract**

**Steps:**
1. Log in as employer
2. Ensure sufficient escrow balance
3. Navigate to `/bids`
4. Accept a gig worker's bid
5. Confirm acceptance

**Expected Result:** 
- Project record created
- Transaction record created
- Contract record created
- All records linked properly
- Escrow funds allocated
- Success message displayed

**User Type:** Employer

---

#### **CASE-062: Accepting bid fails with insufficient escrow**

**Steps:**
1. Log in as employer
2. Ensure escrow balance is less than bid amount
3. Navigate to `/bids`
4. Attempt to accept a bid
5. Click "Accept Bid"

**Expected Result:** 
- Error message: "Insufficient escrow balance to accept this proposal"
- Required amount and current balance displayed
- Bid not accepted
- No contract created
- User prompted to add funds

**User Type:** Employer

---

### 4.2 Update Contract Status (CASE-028 to CASE-030)

#### **Test URLs:**
- Sign Contract Page: `http://localhost/contracts/{contract}/sign`
- Route: `Route::patch('/contracts/{contract}/sign', [ContractController::class, 'updateSignature'])->name('contracts.updateSignature')`

#### **CASE-028: User enters invalid input**

**Steps:**
1. Log in as employer or gig worker
2. Navigate to `/contracts/{contract_id}/sign`
3. Submit without agreeing to terms (agree = false)
4. Click "Sign" button

**Expected Result:** 
- Validation error: "You must agree to the contract terms"
- Contract not signed

**User Type:** Employer or Gig Worker

---

#### **CASE-029: User leaves required field empty**

**Steps:**
1. Log in as employer or gig worker
2. Navigate to `/contracts/{contract_id}/sign`
3. Leave agreement checkbox unchecked
4. Click "Sign" button

**Expected Result:** 
- Validation error: "Agreement is required"
- Contract not signed

**User Type:** Employer or Gig Worker

---

#### **CASE-030: User enters valid data**

**Steps:**
1. Log in as employer
2. Navigate to `/contracts/{contract_id}/sign`
3. Review contract terms
4. Check "I agree" checkbox
5. Click "Sign Contract" button
6. Log out and log in as gig worker
7. Navigate to same contract
8. Sign contract as gig worker

**Expected Result:** 
- First signature recorded (employer_signed_at)
- Success message: "Contract signed successfully"
- After both sign: contract status becomes "fully_executed"
- Project can begin
- Both parties notified

**User Type:** Employer and Gig Worker

---

### 4.3 Payment Processing (CASE-031 to CASE-033)

#### **Test URLs:**
- Payment Deposit Page: `http://localhost/employer/wallet`
- Route: `Route::post('/payments/deposit', [PaymentController::class, 'deposit'])->name('payments.deposit')`
- Middleware: `auth`

#### **CASE-031: User enters invalid input**

**Steps:**
1. Log in as employer
2. Navigate to `/employer/wallet`
3. Enter deposit amount: `-100` (negative)
4. Click "Deposit" button

**Expected Result:** 
- Validation error: "The amount must be at least 1"
- Payment not processed

**User Type:** Employer

---

#### **CASE-032: User leaves required field empty**

**Steps:**
1. Log in as employer
2. Navigate to `/employer/wallet`
3. Leave amount field empty
4. Click "Deposit" button

**Expected Result:** 
- Validation error: "The amount field is required"
- Payment not processed

**User Type:** Employer

---

#### **CASE-033: User enters valid data**

**Steps:**
1. Log in as employer
2. Navigate to `/employer/wallet`
3. Enter deposit amount: `500`
4. Click "Deposit" button
5. Complete payment gateway process (Stripe)

**Expected Result:** 
- Redirected to payment gateway
- Payment processed successfully
- Escrow balance updated
- Transaction recorded
- Success message displayed

**User Type:** Employer

---

## 5. Review and Messaging

### Module Information
- **Test Cases:** CASE-034 to CASE-042
- **User Roles:** Employer, Gig Worker
- **Total Tests:** 9

---

### 5.1 Submit Review (CASE-034 to CASE-036)

#### **Test URLs:**
- Reviews Page: `http://localhost/reviews`
- Route: `Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store')`

#### **CASE-034: User enters invalid input**

**Steps:**
1. Log in as employer or gig worker
2. Navigate to completed project
3. Click "Submit Review"
4. Enter rating: `0` (out of range)
5. Enter comment: `Bad` (less than 10 characters)
6. Click "Submit Review" button

**Expected Result:** 
- Validation error: "The rating must be between 1 and 5"
- Validation error: "The comment must be at least 10 characters"
- Review not created

**User Type:** Employer or Gig Worker

---

#### **CASE-035: User leaves required field empty**

**Steps:**
1. Log in as employer or gig worker
2. Navigate to completed project
3. Click "Submit Review"
4. Leave rating unselected
5. Leave comment empty
6. Click "Submit Review" button

**Expected Result:** 
- Validation error: "The rating field is required"
- Validation error: "The comment field is required"
- Review not created

**User Type:** Employer or Gig Worker

---

#### **CASE-036: User enters valid data**

**Steps:**
1. Log in as employer
2. Navigate to completed project
3. Click "Submit Review"
4. Select rating: `5` stars
5. Enter comment: (at least 10 characters)
   `Excellent work! Delivered on time and exceeded expectations.`
6. Click "Submit Review" button

**Expected Result:** 
- Success message: "Review submitted successfully"
- Review saved to database
- Review visible on gig worker's profile
- Rating updated

**User Type:** Employer or Gig Worker

---

### 5.2 View Feedback (CASE-037 to CASE-039)

#### **Test URLs:**
- Reviews Index: `http://localhost/reviews`
- Route: `Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews.index')`

#### **CASE-037: User enters invalid input**

**Steps:**
1. Log in as any user
2. Navigate to `/reviews`
3. Enter invalid filter parameters
4. Apply filters

**Expected Result:** 
- No results or all reviews shown
- Graceful error handling
- No application errors

**User Type:** Any (authenticated)

---

#### **CASE-038: User leaves required field empty**

**Steps:**
1. Log in as any user
2. Navigate to `/reviews`
3. Leave filters empty
4. View reviews

**Expected Result:** 
- All reviews displayed
- Default view shown
- No errors

**User Type:** Any (authenticated)

---

#### **CASE-039: User enters valid data**

**Steps:**
1. Log in as any user
2. Navigate to `/reviews?user_id={user_id}`
3. View specific user's reviews

**Expected Result:** 
- Reviews for specified user displayed
- Rating summary shown
- Pagination works
- Filter criteria maintained

**User Type:** Any (authenticated)

---

### 5.3 In-App Chat (CASE-040 to CASE-042)

#### **Test URLs:**
- Messages Page: `http://localhost/messages`
- Conversation: `http://localhost/messages/{user}`
- Route: `Route::post('/messages', [MessageController::class, 'store'])->name('messages.store')`

#### **CASE-040: User enters invalid input**

**Steps:**
1. Log in as any user
2. Navigate to `/messages`
3. Select a conversation
4. Enter empty message
5. Try to attach file larger than 10MB
6. Click "Send" button

**Expected Result:** 
- Validation error: "The message field is required when attachment is not present"
- Validation error: "The attachment must not be greater than 10240 kilobytes"
- Message not sent

**User Type:** Any (authenticated)

---

#### **CASE-041: User leaves required field empty**

**Steps:**
1. Log in as any user
2. Navigate to `/messages`
3. Select a conversation
4. Leave message field empty
5. Do not attach any file
6. Click "Send" button

**Expected Result:** 
- Validation error: "The message field is required"
- Message not sent

**User Type:** Any (authenticated)

---

#### **CASE-042: User enters valid data**

**Steps:**
1. Log in as employer
2. Navigate to `/messages`
3. Select gig worker conversation
4. Enter message: `Hello, how is the project coming along?`
5. Optionally attach a file (under 10MB)
6. Click "Send" button

**Expected Result:** 
- Success message: "Message sent successfully"
- Message delivered to recipient
- Message appears in conversation
- Recipient notified
- Attachment stored if included

**User Type:** Any (authenticated)

---

## 6. Admin Operations

### Module Information
- **Test Cases:** CASE-072 to CASE-109
- **User Role:** Admin only
- **Total Tests:** 38

---

### 6.1 Admin Authorization (CASE-072 to CASE-075)

#### **Test URLs:**
- Admin Dashboard: `http://localhost/admin/dashboard`
- Route: `Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard')`
- Middleware: `auth`, `admin`

#### **CASE-072: Non-admin users cannot access admin dashboard**

**Steps:**
1. Log in as gig worker or employer (non-admin)
2. Attempt to navigate to `/admin/dashboard`

**Expected Result:** 
- Access denied (403 Forbidden)
- Redirected to appropriate user dashboard
- Error message displayed

**User Type:** Gig Worker or Employer (negative test)

---

#### **CASE-073: Admin middleware protects admin routes**

**Steps:**
1. Log in as regular user
2. Attempt to access any admin route:
   - `/admin/users`
   - `/admin/projects`
   - `/admin/fraud`

**Expected Result:** 
- All admin routes blocked
- Consistent 403 Forbidden response
- User cannot bypass middleware

**User Type:** Non-admin (negative test)

---

#### **CASE-074: Admin user can access admin dashboard**

**Steps:**
1. Log in as admin user
2. Navigate to `/admin/dashboard`

**Expected Result:** 
- Admin dashboard loads successfully
- Statistics and metrics displayed
- Navigation menu visible
- Full admin access granted

**User Type:** Admin

---

#### **CASE-075: Admin role persists across sessions**

**Steps:**
1. Log in as admin
2. Access admin dashboard
3. Log out
4. Log in again
5. Navigate to admin area

**Expected Result:** 
- Admin privileges maintained
- No need to re-authenticate as admin
- `is_admin` flag persists
- Full access restored

**User Type:** Admin

---

### 6.2 User Management (CASE-076 to CASE-085)

#### **Test URLs:**
- Users List: `http://localhost/admin/users`
- User Details: `http://localhost/admin/users/{user}`
- Routes:
  - `Route::get('/admin/users', [AdminController::class, 'users'])->name('admin.users')`
  - `Route::patch('/admin/users/{user}/status', [AdminController::class, 'updateUserStatus'])->name('admin.users.updateStatus')`

#### **CASE-076: Admin views all users list**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users`

**Expected Result:** 
- Complete list of all users displayed
- User types, statuses, and details shown
- Pagination works
- Search and filter options available

**User Type:** Admin

---

#### **CASE-077: Admin views specific user details**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users`
3. Click on specific user
4. View user details at `/admin/users/{user_id}`

**Expected Result:** 
- Complete user profile displayed
- Activity history shown
- Projects and transactions visible
- Edit options available

**User Type:** Admin

---

#### **CASE-078: Admin updates user status successfully**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users/{user_id}`
3. Change user status to "suspended"
4. Click "Update Status" button

**Expected Result:** 
- Success message: "User status updated successfully"
- User status changed in database
- User affected by new status
- Action logged in audit trail

**User Type:** Admin

---

#### **CASE-079: Admin updates user with invalid status**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users/{user_id}`
3. Attempt to set invalid status value
4. Submit update

**Expected Result:** 
- Validation error displayed
- Invalid status rejected
- User status unchanged
- No database update

**User Type:** Admin

---

#### **CASE-080: Admin suspends user account**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users/{user_id}`
3. Click "Suspend User" button
4. Confirm suspension

**Expected Result:** 
- User account suspended
- User cannot log in
- Active sessions terminated
- Success message displayed
- Action logged

**User Type:** Admin

---

#### **CASE-081: Admin activates suspended user**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users/{suspended_user_id}`
3. Click "Activate User" button
4. Confirm activation

**Expected Result:** 
- User account activated
- User can log in again
- Status updated to active
- Success message displayed

**User Type:** Admin

---

#### **CASE-082: Admin deletes user with active projects**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users/{user_id}` (user with ongoing projects)
3. Click "Delete User" button
4. Confirm deletion

**Expected Result:** 
- Cascading deletion or error message
- Related records handled appropriately
- Projects reassigned or closed
- Referential integrity maintained

**User Type:** Admin

---

#### **CASE-083: Admin filters users by type**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users`
3. Apply filter: User type = "gig_worker"
4. Submit filter

**Expected Result:** 
- Only gig workers displayed
- Filter correctly applied
- Count updated
- Results accurate

**User Type:** Admin

---

#### **CASE-084: Admin bulk suspends multiple users**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users`
3. Select multiple users (checkboxes)
4. Click "Bulk Suspend" button
5. Confirm action

**Expected Result:** 
- All selected users suspended
- Bulk operation successful
- Success message with count
- Individual confirmations not required

**User Type:** Admin

---

#### **CASE-085: Admin cannot delete own account**

**Steps:**
1. Log in as admin
2. Navigate to own user profile `/admin/users/{own_user_id}`
3. Attempt to delete own account
4. Click "Delete" button

**Expected Result:** 
- Operation prevented
- Error message: "Cannot delete your own account"
- Account remains active
- Safety check successful

**User Type:** Admin

---

### 6.3 ID Verification (CASE-086 to CASE-095)

#### **Test URLs:**
- Verifications List: `http://localhost/admin/id-verifications`
- Verification Details: `http://localhost/admin/id-verifications/{user}`
- Routes:
  - `Route::get('/admin/id-verifications', [...IdVerificationController::class, 'index'])->name('admin.id-verifications.index')`
  - `Route::post('/admin/id-verifications/{user}/approve', [...]->name('admin.id-verifications.approve')`

#### **CASE-086: Admin views pending verification requests**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications`
3. Filter by status: "pending"

**Expected Result:** 
- All pending verifications listed
- User details and documents shown
- Quick action buttons available
- Filter works correctly

**User Type:** Admin

---

#### **CASE-087: Admin approves ID verification**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications`
3. Select pending verification
4. Review uploaded document
5. Click "Approve" button

**Expected Result:** 
- Verification approved
- User marked as verified
- User notified of approval
- Success message displayed

**User Type:** Admin

---

#### **CASE-088: Admin rejects ID verification with reason**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications/{user}`
3. Review document
4. Enter rejection reason: `Document is expired`
5. Click "Reject" button

**Expected Result:** 
- Verification rejected
- Reason stored in database
- User notified with reason
- User can resubmit

**User Type:** Admin

---

#### **CASE-089: Admin rejects verification without reason**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications/{user}`
3. Leave rejection reason empty
4. Click "Reject" button

**Expected Result:** 
- Validation error: "Rejection reason is required"
- Verification not rejected
- User not notified

**User Type:** Admin

---

#### **CASE-090: Admin views verification document**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications/{user}`
3. Click "View Document" button

**Expected Result:** 
- Document displayed in browser or downloaded
- Image/PDF renders correctly
- Secure access only for admin
- Document not publicly accessible

**User Type:** Admin

---

#### **CASE-091: Admin requests additional documentation**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications/{user}`
3. Click "Request Resubmit" button
4. Enter message: `Please provide a clearer photo`

**Expected Result:** 
- User notified of request
- Verification status updated
- User can upload new document
- Message delivered

**User Type:** Admin

---

#### **CASE-092: Admin approves already verified user**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications/{verified_user}`
3. Attempt to approve again
4. Click "Approve" button

**Expected Result:** 
- No error occurs
- Informative message: "User already verified"
- No duplicate verification
- Idempotent operation

**User Type:** Admin

---

#### **CASE-093: Admin filters verifications by status**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications`
3. Select filter: Status = "approved"
4. Apply filter

**Expected Result:** 
- Only approved verifications shown
- Filter applied correctly
- Count updated
- Results accurate

**User Type:** Admin

---

#### **CASE-094: Admin views verification history**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications/{user}`
3. View verification attempts tab

**Expected Result:** 
- Complete verification timeline shown
- All attempts listed
- Dates and statuses displayed
- Historical data preserved

**User Type:** Admin

---

#### **CASE-095: Admin exports verification reports**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/id-verifications`
3. Select date range
4. Click "Export CSV" button

**Expected Result:** 
- CSV file generated
- All verification data included
- File downloads successfully
- Data formatted correctly

**User Type:** Admin

---

### 6.4 Fraud Detection (CASE-096 to CASE-104)

#### **Test URLs:**
- Fraud Dashboard: `http://localhost/admin/fraud/dashboard`
- Fraud Cases: `http://localhost/admin/fraud/cases`
- Routes:
  - `Route::get('/admin/fraud/cases', [AdminFraudController::class, 'cases'])->name('admin.fraud.cases')`

#### **CASE-096: Admin views flagged accounts**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases`
3. View list of flagged accounts

**Expected Result:** 
- All fraud cases listed
- Risk levels displayed
- Case statuses shown
- Quick action buttons available

**User Type:** Admin

---

#### **CASE-097: Admin investigates fraud case**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases/{case_id}`
3. Review case details

**Expected Result:** 
- Complete case information displayed
- User activity logs shown
- Transaction history visible
- Evidence links available

**User Type:** Admin

---

#### **CASE-098: Admin marks fraud case as resolved**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases/{case_id}`
3. Add resolution notes
4. Click "Mark as Resolved" button

**Expected Result:** 
- Case status updated to "resolved"
- Resolution notes saved
- Success message displayed
- Case moves to resolved list

**User Type:** Admin

---

#### **CASE-099: Admin permanently bans fraudulent user**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases/{case_id}`
3. Click "Ban User" button
4. Confirm permanent ban

**Expected Result:** 
- User account permanently banned
- All active sessions terminated
- User cannot create new account
- Ban recorded in system

**User Type:** Admin

---

#### **CASE-100: Admin updates fraud case invalid status**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases/{case_id}`
3. Attempt to set invalid status
4. Submit update

**Expected Result:** 
- Validation error displayed
- Invalid status rejected
- Case status unchanged

**User Type:** Admin

---

#### **CASE-101: Admin views fraud detection metrics**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/analytics`

**Expected Result:** 
- Fraud statistics displayed
- Charts and graphs shown
- Trend analysis available
- Metrics accurate

**User Type:** Admin

---

#### **CASE-102: Admin creates manual fraud alert**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases`
3. Click "Create Alert" button
4. Enter user ID and reason
5. Submit alert

**Expected Result:** 
- Manual fraud case created
- User flagged for review
- Alert saved in system
- Assigned for investigation

**User Type:** Admin

---

#### **CASE-103: Admin reviews transaction patterns**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases/{case_id}`
3. View transaction analysis tab

**Expected Result:** 
- Transaction patterns displayed
- Suspicious activity highlighted
- Timeline visualization shown
- Pattern analysis accurate

**User Type:** Admin

---

#### **CASE-104: Admin links related fraud cases**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/fraud/cases/{case_id}`
3. Click "Link Related Cases" button
4. Select related case IDs
5. Submit linking

**Expected Result:** 
- Cases linked in database
- Relationship displayed
- Cross-reference available
- Investigation coordinated

**User Type:** Admin

---

### 6.5 Security Testing (CASE-105 to CASE-109)

#### **Test URLs:**
- Various admin routes

#### **CASE-105: Admin panel protected against XSS**

**Steps:**
1. Log in as admin
2. Navigate to any admin form
3. Enter script tag: `<script>alert('XSS')</script>`
4. Submit form

**Expected Result:** 
- Script tags escaped/sanitized
- No JavaScript execution
- Data stored safely
- XSS attack prevented

**User Type:** Admin

---

#### **CASE-106: Admin actions require CSRF token**

**Steps:**
1. Create POST request without CSRF token
2. Attempt to submit admin action
3. Submit form

**Expected Result:** 
- 419 Page Expired error
- Request rejected
- CSRF protection active
- No unauthorized actions

**User Type:** Admin (security test)

---

#### **CASE-107: Admin actions logged for audit**

**Steps:**
1. Log in as admin
2. Perform any admin action (e.g., suspend user)
3. Navigate to `/admin/fraud/audit-logs`

**Expected Result:** 
- Action recorded in audit log
- Timestamp, admin ID, action type logged
- Audit trail complete
- Compliance maintained

**User Type:** Admin

---

#### **CASE-108: Concurrent admin updates handled safely**

**Steps:**
1. Open two browser sessions as admin
2. Navigate to same user record in both
3. Update user status in session 1
4. Immediately update same user in session 2

**Expected Result:** 
- No race conditions
- Last update wins or conflict detected
- Data integrity maintained
- No corruption

**User Type:** Admin (concurrency test)

---

#### **CASE-109: Admin export prevents SQL injection**

**Steps:**
1. Log in as admin
2. Navigate to `/admin/users/export`
3. Enter SQL injection in filter: `'; DROP TABLE users; --`
4. Submit export

**Expected Result:** 
- SQL injection escaped
- Query parameterized
- Database not affected
- Export fails gracefully or returns safe data

**User Type:** Admin (security test)

---

## 7. Advanced Features

### 7.1 AI Matching (CASE-058)

#### **CASE-058: Required skills weighted higher than preferred**

**Testing Method:** Automated test only
**Test File:** `tests/Unit/Services/AIJobMatchingServiceTest.php`

**Manual Observation:**
1. Log in as gig worker
2. View AI-recommended jobs
3. Verify jobs matching required skills appear first
4. Confirm weighting algorithm works correctly

---

### 7.2 Profile Completion (CASE-059 to CASE-060, CASE-064)

#### **CASE-059: Non-gig workers always 100% complete**

**Steps:**
1. Log in as employer
2. Navigate to `/profile`
3. Observe profile completion percentage

**Expected Result:**
- Employers always show 100% completion
- Non-gig worker profiles not tracked for completion

**User Type:** Employer

---

#### **CASE-060: Profile completion percentage updates dynamically**

**Steps:**
1. Log in as gig worker
2. Navigate to `/profile`
3. Note current completion percentage
4. Add skills
5. Add portfolio items
6. Refresh page

**Expected Result:**
- Completion percentage increases
- Calculation accurate
- Updates reflect immediately

**User Type:** Gig Worker

---

#### **CASE-064: Profile picture uploads to R2 and deletes old**

**Steps:**
1. Log in as any user
2. Navigate to `/profile`
3. Upload profile picture
4. Upload new profile picture (replacing old)

**Expected Result:**
- New image uploaded to R2 storage
- Old image deleted from R2
- Profile picture URL updated
- No orphaned files

**User Type:** Any (authenticated)

---

### 7.3 Database Integrity (CASE-063)

#### **CASE-063: Unique constraint on (job_id, gig_worker_id)**

**Testing Method:** Automated test only
**Test File:** `tests/Unit/Database/ConstraintsTest.php`

**Manual Observation:**
1. Log in as gig worker
2. Submit bid on a job
3. Attempt to submit second bid on same job
4. Observe error

**Expected Result:**
- Duplicate bid prevented
- Database constraint enforced
- Error message displayed

---

### 7.4 Notifications (CASE-065)

#### **CASE-065: Verify email reminder not duplicated**

**Testing Method:** Automated test only (potentially skipped)
**Test File:** `tests/Feature/Auth/VerifyEmailReminderTest.php`

---

### 7.5 Payment Integration (CASE-066)

#### **CASE-066: Stripe webhook rejects invalid signature**

**Testing Method:** Automated test only
**Test File:** `tests/Feature/Webhooks/StripeWebhookTest.php`

**Manual Testing:** Use Stripe CLI to send test webhooks

---

### 7.6 Performance (CASE-068)

#### **CASE-068: Jobs index has reasonable query count**

**Testing Method:** Automated test only
**Test File:** `tests/Feature/Performance/JobsListingPerformanceTest.php`

**Manual Observation:**
1. Enable Laravel Debugbar
2. Navigate to `/jobs`
3. Check query count (should be < 20)
4. Verify no N+1 query issues

---

### 7.7 Validation (CASE-070)

#### **CASE-070: Deadline after:today respects timezone**

**Testing Method:** Automated test only
**Test File:** `tests/Unit/I18n/EmailAndDateRulesTest.php`

---

### 7.8 Data Sanitization (CASE-071)

#### **CASE-071: Random skills/languages arrays sanitized**

**Testing Method:** Automated test only (fuzz testing)
**Test File:** `tests/Unit/Fuzz/SkillsAndLanguagesFuzzTest.php`

---

## Automated Testing Commands

### Prerequisites

```bash
# Navigate to project directory
cd "C:\Users\Administrator\Desktop\WorkWise4\New folder\WorkWise"

# Ensure dependencies installed
composer install
npm install
```

### Running All Tests

#### Run Complete Test Suite
```bash
php artisan test
```

#### Run with Coverage (requires Xdebug)
```bash
php artisan test --coverage
```

#### Run Comprehensive Unit Test File
```bash
php artisan test tests/Feature/WorkWiseComprehensiveUnitTest.php
```

---

### Running Tests by Module

#### Account Management Tests
```bash
# Login validation
php artisan test tests/Unit/Requests/LoginRequestTest.php

# Profile validation
php artisan test tests/Feature/Profile/ProfileRequestValidationTest.php

# Auth hardening (rate limiting, remember-me)
php artisan test tests/Feature/Auth/AuthHardeningTest.php

# Google OAuth
php artisan test tests/Feature/Auth/GoogleOAuthTest.php

# Email verification
php artisan test tests/Feature/Auth/VerifyEmailReminderTest.php

# I18n email validation
php artisan test tests/Unit/I18n/EmailAndDateRulesTest.php
```

#### Job Management Tests
```bash
# Job validation tests
php artisan test tests/Feature/Jobs/JobValidationTest.php

# Performance test
php artisan test tests/Feature/Performance/JobsListingPerformanceTest.php
```

#### Bidding Module Tests
```bash
# Bid validation
php artisan test tests/Feature/Bids/BidValidationTest.php

# Authorization policies
php artisan test tests/Feature/Policies/PoliciesTest.php
```

#### Contract & Payment Tests
```bash
# Contract escrow flow
php artisan test tests/Feature/Contracts/ContractEscrowFlowTest.php

# Stripe webhooks
php artisan test tests/Feature/Webhooks/StripeWebhookTest.php
```

#### Profile Tests
```bash
# Profile completion service
php artisan test tests/Unit/Services/ProfileCompletionServiceTest.php

# R2 upload
php artisan test tests/Feature/Profile/ProfileR2UploadTest.php
```

#### AI & Services Tests
```bash
# AI job matching
php artisan test tests/Unit/Services/AIJobMatchingServiceTest.php
```

#### Database Tests
```bash
# Database constraints
php artisan test tests/Unit/Database/ConstraintsTest.php
```

#### Security & Sanitization Tests
```bash
# Fuzz testing
php artisan test tests/Unit/Fuzz/SkillsAndLanguagesFuzzTest.php
```

---

### Running Frontend Tests (Jest)

#### Run All Jest Tests
```bash
npm test
```

#### Run Jest Tests in Watch Mode
```bash
npm run test:watch
```

#### Run Jest with Coverage
```bash
npm run test:coverage
```

#### Run Specific Component Tests
```bash
# Primary Button tests
npm test -- PrimaryButton

# Text Input tests
npm test -- TextInput

# Checkbox tests
npm test -- Checkbox
```

---

### Test Files Reference

#### Comprehensive Test Suite
- **File:** `tests/Feature/WorkWiseComprehensiveUnitTest.php`
- **Cases:** CASE-001 to CASE-042, CASE-072 to CASE-109
- **Description:** Contains all primary functionality tests including admin operations

#### New Unit Test Files (Advanced Features)
1. `tests/Unit/Requests/LoginRequestTest.php` - Login validation (CASE-043)
2. `tests/Feature/Profile/ProfileRequestValidationTest.php` - Profile validation (CASE-044 to CASE-046)
3. `tests/Feature/Jobs/JobValidationTest.php` - Job validation (CASE-047 to CASE-049)
4. `tests/Feature/Bids/BidValidationTest.php` - Bid validation (CASE-050 to CASE-051)
5. `tests/Feature/Auth/AuthHardeningTest.php` - Auth security (CASE-052 to CASE-054)
6. `tests/Feature/Policies/PoliciesTest.php` - Authorization (CASE-055 to CASE-057)
7. `tests/Unit/Services/AIJobMatchingServiceTest.php` - AI matching (CASE-058)
8. `tests/Unit/Services/ProfileCompletionServiceTest.php` - Profile completion (CASE-059 to CASE-060)
9. `tests/Feature/Contracts/ContractEscrowFlowTest.php` - Contracts (CASE-061 to CASE-062)
10. `tests/Unit/Database/ConstraintsTest.php` - Database integrity (CASE-063)
11. `tests/Feature/Profile/ProfileR2UploadTest.php` - R2 storage (CASE-064)
12. `tests/Feature/Auth/VerifyEmailReminderTest.php` - Notifications (CASE-065)
13. `tests/Feature/Webhooks/StripeWebhookTest.php` - Payment integration (CASE-066)
14. `tests/Feature/Auth/GoogleOAuthTest.php` - OAuth (CASE-067)
15. `tests/Feature/Performance/JobsListingPerformanceTest.php` - Performance (CASE-068)
16. `tests/Unit/I18n/EmailAndDateRulesTest.php` - Validation (CASE-069 to CASE-070)
17. `tests/Unit/Fuzz/SkillsAndLanguagesFuzzTest.php` - Data sanitization (CASE-071)

#### Frontend Component Tests (Jest)
1. `resources/js/Components/__tests__/PrimaryButton.test.jsx`
2. `resources/js/Components/__tests__/TextInput.test.jsx`
3. `resources/js/Components/__tests__/Checkbox.test.jsx`

---

## Testing Best Practices

### Before Testing
1. **Database Setup:** Ensure test database is configured
2. **Seed Data:** Run seeders for test users
   ```bash
   php artisan db:seed --class=TestUserSeeder
   ```
3. **Clear Cache:** Clear application cache
   ```bash
   php artisan cache:clear
   php artisan config:clear
   ```

### During Testing
1. **Isolate Tests:** Run tests in isolation to avoid state interference
2. **Check Logs:** Monitor `storage/logs/laravel.log` for errors
3. **Use Debugbar:** Enable Laravel Debugbar for query monitoring
4. **Browser DevTools:** Use console and network tabs for frontend issues

### After Testing
1. **Review Results:** Check all test results in Excel file
2. **Document Issues:** Note any failures with screenshots
3. **Update Status:** Mark tests as passed/failed in tracking sheet

---

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
- **Issue:** "Unauthenticated" errors
- **Solution:** Ensure user is logged in before accessing protected routes
- **Check:** Session middleware active

#### 2. CSRF Token Mismatch
- **Issue:** 419 Page Expired
- **Solution:** Include CSRF token in forms
- **Check:** `@csrf` directive present

#### 3. Validation Errors Not Displayed
- **Issue:** Errors not showing in UI
- **Solution:** Check Inertia error handling
- **Check:** Error bag passed to frontend

#### 4. Database Connection Errors
- **Issue:** Cannot connect to database
- **Solution:** Check `.env` configuration
- **Check:** Database service running

#### 5. Permission Denied Errors
- **Issue:** 403 Forbidden on valid routes
- **Solution:** Check user role and middleware
- **Check:** User has correct `user_type` and `is_admin` flag

---

## Appendix

### Test Data Requirements

#### Minimum Required Data for Testing

**Users:**
- 1 Admin user
- 2 Employer users
- 3 Gig Worker users

**Jobs:**
- 5 active jobs (various categories)
- 2 completed jobs

**Bids:**
- 10 bids (mix of pending, accepted, rejected)

**Contracts:**
- 3 contracts (various statuses)

**Messages:**
- Conversation history between users

**Reviews:**
- 5 reviews (various ratings)

### Database Seeders

```bash
# Seed all test data
php artisan db:seed

# Seed specific data
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=JobSeeder
php artisan db:seed --class=BidSeeder
```

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-02 | Rachel Palacat | Initial comprehensive guide created |

---

**End of Manual Testing Guide**

