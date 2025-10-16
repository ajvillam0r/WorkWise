# WorkWise Database ERD - Column Names Only

This document contains the simplified table structures for the WorkWise platform database, showing only column names for ERD creation.

## 1. Users Table

- id (Unique user identifier)
- first_name (First name of employer or gig worker)
- last_name (Last name of employer or gig worker)
- name (Full name for Google OAuth users)
- email (User's email address)
- email_verified_at (Email verification timestamp)
- password (Encrypted user password)
- barangay (User's barangay location)
- user_type (Type of user: gig_worker or employer)
- is_admin (Admin role flag)
- profile_completed (Profile completion status)
- profile_status (Profile approval status: pending, approved, rejected)
- bio (User biography/description)
- location (User's location)
- phone (User's phone number)
- profile_photo (Profile photo file path)
- professional_title (Professional title for gig workers)
- hourly_rate (Hourly rate for gig workers)
- experience_level (Experience level: entry, intermediate, expert)
- skills (User skills in JSON format)
- languages (Languages spoken in JSON format)
- portfolio_url (Portfolio website URL)
- company_name (Company name for employers)
- work_type_needed (Type of work needed by employers)
- budget_range (Budget range for employers)
- project_intent (Project intentions and goals)
- google_id (Google OAuth identifier)
- avatar (Avatar image URL from Google)
- remember_token (Session remember token)
- created_at (Record creation timestamp)
- updated_at (Record last update timestamp)

---

## 2. Gig Jobs Table (Jobs)

- id (Unique job identifier)
- employer_id (Reference to employer user)
- title (Job title)
- description (Job description and requirements)
- required_skills (Required skills in JSON format)
- budget_type (Budget type: fixed or hourly)
- budget_min (Minimum budget amount)
- budget_max (Maximum budget amount)
- experience_level (Required experience level)
- estimated_duration_days (Estimated project duration in days)
- status (Job status: open, in_progress, completed, cancelled)
- deadline (Project deadline date)
- location (Job location)
- is_remote (Remote work availability flag)
- created_at (Job creation timestamp)
- updated_at (Job last update timestamp)

---

## 3. Bids Table

- id (Unique bid identifier)
- job_id (Reference to gig job)
- gig_worker_id (Reference to gig worker user)
- bid_amount (Proposed bid amount)
- proposal_message (Bid proposal message)
- estimated_days (Estimated completion days)
- status (Bid status: pending, accepted, rejected, withdrawn)
- submitted_at (Bid submission timestamp)
- created_at (Bid creation timestamp)
- updated_at (Bid last update timestamp)

---

## 4. Contracts Table

- id (Unique contract identifier)
- contract_id (Human-readable contract ID)
- project_id (Unique project identifier)
- employer_id (Reference to employer user)
- gig_worker_id (Reference to gig worker user)
- job_id (Reference to original job)
- bid_id (Reference to accepted bid)
- scope_of_work (Detailed work scope description)
- total_payment (Total contract payment amount)
- contract_type (Contract type: fixed or milestone)
- project_start_date (Project start date)
- project_end_date (Project end date)
- employer_responsibilities (Employer's responsibilities)
- gig_worker_responsibilities (Gig worker's responsibilities)
- preferred_communication (Preferred communication method)
- communication_frequency (Communication frequency)
- status (Contract status: draft, pending_signatures, active, completed, terminated, disputed)
- gig_worker_signed_at (Gig worker signature timestamp)
- employer_signed_at (Employer signature timestamp)
- fully_signed_at (Full contract signature completion timestamp)
- pdf_path (Contract PDF file path)
- pdf_generated_at (PDF generation timestamp)
- created_at (Contract creation timestamp)
- updated_at (Contract last update timestamp)

---

## 5. Reviews Table

- id (Unique review identifier)
- project_id (Reference to contract project)
- reviewer_id (Reference to user giving review)
- reviewee_id (Reference to user receiving review)
- rating (Overall rating from 1-5)
- comment (Review comment/feedback)
- criteria_ratings (Detailed criteria ratings in JSON)
- is_public (Public visibility flag)
- created_at (Review creation timestamp)
- updated_at (Review last update timestamp)

---

## 6. Messages Table

- id (Unique message identifier)
- sender_id (Reference to message sender)
- receiver_id (Reference to message receiver)
- project_id (Reference to related project)
- message (Message content/text)
- attachment_path (File attachment path)
- attachment_name (Original attachment filename)
- type (Message type: text, file, system)
- is_read (Message read status flag)
- read_at (Message read timestamp)
- created_at (Message creation timestamp)
- updated_at (Message last update timestamp)

---

## 7. Skills Table (User Skills)

- id (Unique skill identifier)
- name (Skill name)
- slug (URL-friendly skill identifier)
- description (Skill description)
- category (Skill category)
- is_active (Active status flag)
- usage_count (Usage frequency counter)
- created_at (Skill creation timestamp)
- updated_at (Skill last update timestamp)

---

## 8. Escrow Accounts Table (Escrow)

- id (Unique escrow account identifier)
- project_id (Reference to contract project)
- employer_id (Reference to employer user)
- gig_worker_id (Reference to gig worker user)
- total_amount (Total escrow amount)
- platform_fee (Platform fee amount)
- available_amount (Available release amount)
- status (Escrow status: pending, funded, active, completed, disputed, refunded)
- protection_level (Protection level: basic, standard, premium)
- escrow_terms (Escrow terms and conditions in JSON)
- risk_score (Risk assessment score)
- milestone_based (Milestone-based release flag)
- automatic_release (Automatic release flag)
- fraud_insurance (Fraud insurance flag)
- multi_signature (Multi-signature requirement flag)
- funded_at (Escrow funding timestamp)
- expires_at (Escrow expiration timestamp)
- created_at (Escrow creation timestamp)
- updated_at (Escrow last update timestamp)

---

## 9. Transactions Table (Payments)

- id (Unique transaction identifier)
- project_id (Reference to contract project)
- payer_id (Reference to user making payment)
- payee_id (Reference to user receiving payment)
- amount (Transaction amount)
- platform_fee (Platform fee amount)
- net_amount (Net amount after fees)
- type (Transaction type: payment, refund, fee, bonus, penalty)
- status (Transaction status: pending, processing, completed, failed, cancelled)
- stripe_payment_intent_id (Stripe payment intent identifier)
- stripe_charge_id (Stripe charge identifier)
- description (Transaction description)
- metadata (Additional transaction data in JSON)
- processed_at (Transaction processing timestamp)
- created_at (Transaction creation timestamp)
- updated_at (Transaction last update timestamp)

---

## 10. Escrow Milestones Table

- id (Unique milestone identifier)
- escrow_account_id (Reference to escrow account)
- title (Milestone title)
- description (Milestone description)
- amount (Milestone amount)
- order_index (Milestone order sequence)
- status (Milestone status: pending, in_progress, completed, approved, released)
- completion_criteria (Milestone completion criteria)
- deliverables (Expected deliverables in JSON)
- due_date (Milestone due date)
- completed_at (Milestone completion timestamp)
- approved_at (Milestone approval timestamp)
- released_at (Milestone release timestamp)
- created_at (Milestone creation timestamp)
- updated_at (Milestone last update timestamp)

---

## Key Relationships

1. **Users** → **Gig Jobs** (1:N) - One user can create multiple jobs
2. **Users** → **Bids** (1:N) - One user can make multiple bids
3. **Gig Jobs** → **Bids** (1:N) - One job can have multiple bids
4. **Bids** → **Contracts** (1:1) - One accepted bid creates one contract
5. **Contracts** → **Reviews** (1:2) - One contract can have two reviews (mutual)
6. **Contracts** → **Messages** (1:N) - One contract can have multiple messages
7. **Contracts** → **Escrow Accounts** (1:1) - One contract has one escrow account
8. **Contracts** → **Transactions** (1:N) - One contract can have multiple transactions
9. **Escrow Accounts** → **Escrow Milestones** (1:N) - One escrow can have multiple milestones
10. **Users** → **Skills** (N:N) - Many-to-many relationship through JSON fields

---

*Simplified ERD for WorkWise Capstone Research*