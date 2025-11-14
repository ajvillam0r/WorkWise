# WorkWise Database Seeders

## Overview

This directory contains database seeders for the WorkWise platform. The seeders create test data for development and testing purposes.

## Active Seeders

### 1. AdminUserSeeder
Creates the admin user account.

**Credentials:**
- Email: `admin@workwise.com`
- Password: `password`

### 2. CleanWorkWiseSeeder
Creates a clean set of test data with 3 gig workers and 3 employers, each with complete profiles based on predefined selections from the skills taxonomy.

## Test Accounts

### Gig Workers

#### 1. Carlos Mendoza - Senior Full-Stack Developer
- **Email:** `carlos.dev@workwise.ph`
- **Password:** `password123`
- **Expertise:** Expert level
- **Hourly Rate:** ₱850/hour
- **Skills:** Full-stack web development, e-commerce, API development
- **Technologies:** PHP, Laravel, JavaScript, React, Vue.js, Node.js, MySQL, PostgreSQL, MongoDB
- **Location:** Makati City, Philippines

#### 2. Maria Santos - UI/UX Designer & Brand Specialist
- **Email:** `maria.design@workwise.ph`
- **Password:** `password123`
- **Expertise:** Intermediate level
- **Hourly Rate:** ₱550/hour
- **Skills:** UI/UX design, graphic design, branding, web design
- **Technologies:** Figma, Adobe XD, Photoshop, Illustrator, Canva
- **Location:** Quezon City, Philippines

#### 3. Juan Dela Cruz - Content Writer & SEO Specialist
- **Email:** `juan.writer@workwise.ph`
- **Password:** `password123`
- **Expertise:** Intermediate level
- **Hourly Rate:** ₱420/hour
- **Skills:** Content writing, SEO, copywriting, technical writing
- **Technologies:** SEO tools, content management systems
- **Location:** Cebu City, Philippines

### Employers

#### 1. InnovateTech Solutions (Tech Startup)
- **Email:** `tech.startup@workwise.ph`
- **Password:** `password123`
- **Contact:** Robert Tan
- **Industry:** Technology
- **Company Size:** 11-50 employees
- **Budget Range:** ₱50,000 - ₱200,000
- **Hiring Needs:** Web Development, Mobile Apps, UI/UX Design
- **Location:** Taguig City, Philippines
- **Escrow Balance:** ₱250,000

**Posted Jobs:**
1. Full-Stack Developer for SaaS Platform (₱80,000 - ₱120,000)
2. UI/UX Designer for Mobile App (₱45,000 - ₱70,000)

#### 2. Creative Minds Agency (Creative Agency)
- **Email:** `creative.agency@workwise.ph`
- **Password:** `password123`
- **Contact:** Sofia Reyes
- **Industry:** Marketing & Advertising
- **Company Size:** 6-10 employees
- **Budget Range:** ₱20,000 - ₱100,000
- **Hiring Needs:** Graphic Design, Content Writing, Video Editing
- **Location:** Pasig City, Philippines
- **Escrow Balance:** ₱150,000

**Posted Jobs:**
1. Brand Identity Designer for Restaurant Chain (₱40,000 - ₱65,000)
2. Content Writer for Tech Blog (₱25,000 - ₱40,000)

#### 3. ShopPH Online Store (E-Commerce Business)
- **Email:** `ecommerce.business@workwise.ph`
- **Password:** `password123`
- **Contact:** Michael Garcia
- **Industry:** E-Commerce & Retail
- **Company Size:** 51-200 employees
- **Budget Range:** ₱30,000 - ₱150,000
- **Hiring Needs:** E-commerce Development, Content Writing, Customer Support
- **Location:** Manila, Philippines
- **Escrow Balance:** ₱180,000

**Posted Jobs:**
1. E-Commerce Website Enhancement (₱55,000 - ₱85,000)
2. Product Description Writer (₱20,000 - ₱35,000)

## Running the Seeders

### Fresh Database with Seeders
```bash
php artisan migrate:fresh --seed
```

### Run Seeders Only
```bash
php artisan db:seed
```

### Run Specific Seeder
```bash
php artisan db:seed --class=AdminUserSeeder
php artisan db:seed --class=CleanWorkWiseSeeder
```

## Data Structure

### Gig Workers Include:
- Complete profile information
- Professional title and bio
- Location details (country, city, address, postal code)
- Contact information
- Hourly rates
- Broad category and specific services
- Skills with experience levels (beginner, intermediate, expert)
- Working hours and timezone
- Preferred communication methods
- Portfolio links
- Completed onboarding

### Employers Include:
- Complete profile information
- Company details (name, size, industry, website)
- Company description
- Location details
- Contact information
- Hiring needs and preferences
- Budget ranges and project duration
- Escrow balance
- Completed onboarding

### Jobs Include:
- Detailed job descriptions
- Required skills from taxonomy
- Budget information (fixed or hourly)
- Experience level requirements
- Estimated duration
- Remote work options
- Deadlines

## Skills Taxonomy

All skills are based on the predefined taxonomy in `full_freelance_services_taxonomy.json`, which includes:

1. **Creative & Design Services** - Graphic Design, UI/UX, Web Design, etc.
2. **Programming & Tech** - Web Development, Mobile Apps, AI/ML, etc.
3. **Digital Marketing** - SEO, Social Media, Content Marketing, etc.
4. **Writing & Translation** - Content Writing, Copywriting, Technical Writing, etc.
5. **Music & Audio** - Music Production, Voice Over, Podcast Editing, etc.
6. **Photography & Videography** - Photography, Video Editing, etc.
7. **Business & Consulting** - Business Planning, Virtual Assistance, etc.
8. **Data & Analytics** - Data Analysis, Visualization, Machine Learning, etc.
9. **E-Commerce & Product Services** - Store Setup, Product Research, etc.
10. **Engineering & Architecture** - CAD Design, Mechanical Engineering, etc.
11. **Education & Training** - Online Tutoring, Course Creation, etc.
12. **Admin & Virtual Assistance** - Data Entry, Email Management, etc.
13. **Lifestyle & Personal Services** - Fitness Coaching, Travel Planning, etc.
14. **Emerging Services** - NFT Art, Metaverse Development, AI Prompts, etc.

## Notes

- All passwords are set to `password123` for easy testing
- All users have verified email addresses
- All users have completed their onboarding
- Gig workers have diverse skill sets at different experience levels
- Employers represent different industries and company sizes
- Jobs are realistic and match the skills of the gig workers
- All monetary values are in Philippine Pesos (₱)

## Removing Old Seeders

The following seeders are no longer used and can be removed if needed:
- `WorkWiseComprehensiveSeeder.php`
- `GigWorkerSeeder.php`
- `EmployerSeeder.php`
- `WorkWiseSeeder.php`
- Other test-specific seeders

## Maintenance

When updating the seeder:
1. Ensure all skills match the taxonomy in `full_freelance_services_taxonomy.json`
2. Keep user profiles realistic and complete
3. Maintain consistency in data quality
4. Update this README with any changes
