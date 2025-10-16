# WorkWise Database ERD - Table Structures

This document contains the table structures for the WorkWise platform database, organized for Entity Relationship Diagram (ERD) creation.

## 1. Users Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| first_name | varchar(255) | NOT NULL | User's first name |
| last_name | varchar(255) | NOT NULL | User's last name |
| name | varchar(255) | NULLABLE | Full name (Google OAuth) |
| email | varchar(255) | UNIQUE, NOT NULL | User's email address |
| email_verified_at | timestamp | NULLABLE | Email verification timestamp |
| password | varchar(255) | NOT NULL | Encrypted password |
| barangay | varchar(255) | NULLABLE | User's barangay location |
| user_type | enum('gig_worker', 'employer') | NOT NULL | Type of user account |
| is_admin | boolean | DEFAULT false | Admin role flag |
| profile_completed | boolean | DEFAULT false | Profile completion status |
| profile_status | enum('pending', 'approved', 'rejected') | DEFAULT 'pending' | Profile approval status |
| bio | text | NULLABLE | User biography |
| location | varchar(255) | NULLABLE | User's location |
| phone | varchar(255) | NULLABLE | Phone number |
| profile_photo | varchar(255) | NULLABLE | Profile photo path |
| professional_title | varchar(255) | NULLABLE | Professional title |
| hourly_rate | decimal(8,2) | NULLABLE | Hourly rate for gig workers |
| experience_level | enum('entry', 'intermediate', 'expert') | NULLABLE | Experience level |
| skills | json | NULLABLE | User skills (JSON format) |
| languages | json | NULLABLE | Languages spoken (JSON format) |
| portfolio_url | varchar(255) | NULLABLE | Portfolio website URL |
| company_name | varchar(255) | NULLABLE | Company name for employers |
| work_type_needed | varchar(255) | NULLABLE | Type of work needed |
| budget_range | varchar(255) | NULLABLE | Budget range for employers |
| project_intent | text | NULLABLE | Project intentions |
| google_id | varchar(255) | NULLABLE | Google OAuth ID |
| avatar | varchar(255) | NULLABLE | Avatar image URL |
| remember_token | varchar(100) | NULLABLE | Remember token for sessions |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (email)

---

## 2. Gig Jobs Table (Jobs)

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique job identifier |
| employer_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table |
| title | varchar(255) | NOT NULL | Job title |
| description | text | NOT NULL | Job description |
| required_skills | json | NULLABLE | Required skills (JSON format) |
| budget_type | enum('fixed', 'hourly') | NOT NULL | Budget type |
| budget_min | decimal(10,2) | NULLABLE | Minimum budget |
| budget_max | decimal(10,2) | NULLABLE | Maximum budget |
| experience_level | enum('entry', 'intermediate', 'expert') | NOT NULL | Required experience level |
| estimated_duration_days | integer | NULLABLE | Estimated project duration |
| status | enum('open', 'in_progress', 'completed', 'cancelled') | DEFAULT 'open' | Job status |
| deadline | date | NULLABLE | Project deadline |
| location | varchar(255) | NULLABLE | Job location |
| is_remote | boolean | DEFAULT false | Remote work availability |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- employer_id REFERENCES users(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- INDEX (employer_id)
- INDEX (status)

---

## 3. Bids Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique bid identifier |
| job_id | bigint | FOREIGN KEY, NOT NULL | Reference to gig_jobs table |
| gig_worker_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table |
| bid_amount | decimal(10,2) | NOT NULL | Bid amount |
| proposal_message | text | NOT NULL | Proposal message |
| estimated_days | integer | NULLABLE | Estimated completion days |
| status | enum('pending', 'accepted', 'rejected', 'withdrawn') | DEFAULT 'pending' | Bid status |
| submitted_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Bid submission timestamp |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- job_id REFERENCES gig_jobs(id) ON DELETE CASCADE
- gig_worker_id REFERENCES users(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- INDEX (job_id)
- INDEX (gig_worker_id)
- UNIQUE KEY (job_id, gig_worker_id)

---

## 4. Contracts Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique contract identifier |
| contract_id | varchar(255) | UNIQUE, NOT NULL | Human-readable contract ID |
| project_id | varchar(255) | UNIQUE, NOT NULL | Project identifier |
| employer_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table |
| gig_worker_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table |
| job_id | bigint | FOREIGN KEY, NOT NULL | Reference to gig_jobs table |
| bid_id | bigint | FOREIGN KEY, NOT NULL | Reference to bids table |
| scope_of_work | text | NOT NULL | Work scope description |
| total_payment | decimal(10,2) | NOT NULL | Total contract payment |
| contract_type | enum('fixed', 'milestone') | NOT NULL | Contract payment type |
| project_start_date | date | NOT NULL | Project start date |
| project_end_date | date | NOT NULL | Project end date |
| employer_responsibilities | text | NULLABLE | Employer responsibilities |
| gig_worker_responsibilities | text | NULLABLE | Gig worker responsibilities |
| preferred_communication | varchar(255) | NULLABLE | Preferred communication method |
| communication_frequency | varchar(255) | NULLABLE | Communication frequency |
| status | enum('draft', 'pending_signatures', 'active', 'completed', 'terminated', 'disputed') | DEFAULT 'draft' | Contract status |
| gig_worker_signed_at | timestamp | NULLABLE | Gig worker signature timestamp |
| employer_signed_at | timestamp | NULLABLE | Employer signature timestamp |
| fully_signed_at | timestamp | NULLABLE | Full signature completion timestamp |
| pdf_path | varchar(255) | NULLABLE | Contract PDF file path |
| pdf_generated_at | timestamp | NULLABLE | PDF generation timestamp |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- employer_id REFERENCES users(id) ON DELETE CASCADE
- gig_worker_id REFERENCES users(id) ON DELETE CASCADE
- job_id REFERENCES gig_jobs(id) ON DELETE CASCADE
- bid_id REFERENCES bids(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (contract_id)
- UNIQUE KEY (project_id)
- INDEX (employer_id)
- INDEX (gig_worker_id)
- INDEX (job_id)
- INDEX (bid_id)

---

## 5. Reviews Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique review identifier |
| project_id | varchar(255) | NOT NULL | Reference to contract project_id |
| reviewer_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table (reviewer) |
| reviewee_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table (reviewee) |
| rating | integer | NOT NULL | Overall rating (1-5) |
| comment | text | NULLABLE | Review comment |
| criteria_ratings | json | NULLABLE | Detailed criteria ratings |
| is_public | boolean | DEFAULT true | Public visibility flag |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- reviewer_id REFERENCES users(id) ON DELETE CASCADE
- reviewee_id REFERENCES users(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- INDEX (project_id)
- INDEX (reviewer_id)
- INDEX (reviewee_id)
- UNIQUE KEY (project_id, reviewer_id, reviewee_id)

---

## 6. Messages Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique message identifier |
| sender_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table (sender) |
| receiver_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table (receiver) |
| project_id | varchar(255) | NULLABLE | Reference to contract project_id |
| message | text | NOT NULL | Message content |
| attachment_path | varchar(255) | NULLABLE | File attachment path |
| attachment_name | varchar(255) | NULLABLE | Original attachment filename |
| type | enum('text', 'file', 'system') | DEFAULT 'text' | Message type |
| is_read | boolean | DEFAULT false | Read status flag |
| read_at | timestamp | NULLABLE | Message read timestamp |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- sender_id REFERENCES users(id) ON DELETE CASCADE
- receiver_id REFERENCES users(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- INDEX (sender_id)
- INDEX (receiver_id)
- INDEX (project_id)

---

## 7. Skills Table (User Skills)

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique skill identifier |
| name | varchar(255) | UNIQUE, NOT NULL | Skill name |
| slug | varchar(255) | UNIQUE, NOT NULL | URL-friendly skill identifier |
| description | text | NULLABLE | Skill description |
| category | varchar(255) | NULLABLE | Skill category |
| is_active | boolean | DEFAULT true | Active status flag |
| usage_count | integer | DEFAULT 0 | Usage frequency counter |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (name)
- UNIQUE KEY (slug)
- INDEX (category)
- INDEX (is_active)

---

## 8. Escrow Accounts Table (Escrow)

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique escrow account identifier |
| project_id | varchar(255) | UNIQUE, NOT NULL | Reference to contract project_id |
| employer_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table |
| gig_worker_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table |
| total_amount | decimal(10,2) | NOT NULL | Total escrow amount |
| platform_fee | decimal(10,2) | DEFAULT 0.00 | Platform fee amount |
| available_amount | decimal(10,2) | DEFAULT 0.00 | Available release amount |
| status | enum('pending', 'funded', 'active', 'completed', 'disputed', 'refunded') | DEFAULT 'pending' | Escrow status |
| protection_level | enum('basic', 'standard', 'premium') | DEFAULT 'standard' | Protection level |
| escrow_terms | json | NULLABLE | Escrow terms and conditions |
| risk_score | decimal(3,2) | DEFAULT 0.00 | Risk assessment score |
| milestone_based | boolean | DEFAULT false | Milestone-based release flag |
| automatic_release | boolean | DEFAULT true | Automatic release flag |
| fraud_insurance | boolean | DEFAULT false | Fraud insurance flag |
| multi_signature | boolean | DEFAULT false | Multi-signature requirement flag |
| funded_at | timestamp | NULLABLE | Funding timestamp |
| expires_at | timestamp | NULLABLE | Expiration timestamp |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- employer_id REFERENCES users(id) ON DELETE CASCADE
- gig_worker_id REFERENCES users(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (project_id)
- INDEX (employer_id)
- INDEX (gig_worker_id)
- INDEX (status)

---

## 9. Transactions Table (Payments)

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| project_id | varchar(255) | NOT NULL | Reference to contract project_id |
| payer_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table (payer) |
| payee_id | bigint | FOREIGN KEY, NOT NULL | Reference to users table (payee) |
| amount | decimal(10,2) | NOT NULL | Transaction amount |
| platform_fee | decimal(10,2) | DEFAULT 0.00 | Platform fee amount |
| net_amount | decimal(10,2) | NOT NULL | Net amount after fees |
| type | enum('payment', 'refund', 'fee', 'bonus', 'penalty') | NOT NULL | Transaction type |
| status | enum('pending', 'processing', 'completed', 'failed', 'cancelled') | DEFAULT 'pending' | Transaction status |
| stripe_payment_intent_id | varchar(255) | NULLABLE | Stripe payment intent ID |
| stripe_charge_id | varchar(255) | NULLABLE | Stripe charge ID |
| description | text | NULLABLE | Transaction description |
| metadata | json | NULLABLE | Additional transaction metadata |
| processed_at | timestamp | NULLABLE | Processing completion timestamp |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- payer_id REFERENCES users(id) ON DELETE CASCADE
- payee_id REFERENCES users(id) ON DELETE CASCADE

**Indexes:**
- PRIMARY KEY (id)
- INDEX (project_id)
- INDEX (payer_id)
- INDEX (payee_id)
- INDEX (status)
- INDEX (type)

---

## Additional Tables

### Escrow Milestones Table

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique milestone identifier |
| escrow_account_id | bigint | FOREIGN KEY, NOT NULL | Reference to escrow_accounts table |
| title | varchar(255) | NOT NULL | Milestone title |
| description | text | NULLABLE | Milestone description |
| amount | decimal(10,2) | NOT NULL | Milestone amount |
| order_index | integer | NOT NULL | Milestone order |
| status | enum('pending', 'in_progress', 'completed', 'approved', 'released') | DEFAULT 'pending' | Milestone status |
| completion_criteria | text | NULLABLE | Completion criteria |
| deliverables | json | NULLABLE | Expected deliverables |
| due_date | date | NULLABLE | Milestone due date |
| completed_at | timestamp | NULLABLE | Completion timestamp |
| approved_at | timestamp | NULLABLE | Approval timestamp |
| released_at | timestamp | NULLABLE | Release timestamp |
| created_at | timestamp | NULLABLE | Record creation timestamp |
| updated_at | timestamp | NULLABLE | Record update timestamp |

**Foreign Keys:**
- escrow_account_id REFERENCES escrow_accounts(id) ON DELETE CASCADE

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

*Generated for WorkWise Capstone Research ERD*