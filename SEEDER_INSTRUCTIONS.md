# WorkWise Seeders and AI Recommendations Setup

This document provides instructions for setting up and testing the employer and gig worker seeders, along with the AI recommendation system.

## Overview

The seeders create realistic test data for the WorkWise platform:

- **EmployerSeeder**: Creates 5 employer accounts with diverse business types and 25+ job postings
- **GigWorkerSeeder**: Creates 15 gig worker accounts with varied skills and experience levels
- **AI Recommendations**: Matches gig workers to jobs based on skills and experience level compatibility

## Running the Seeders

### 1. Run Individual Seeders

```bash
# Run employer seeder (creates employers and their job postings)
php artisan db:seed --class=EmployerSeeder

# Run gig worker seeder (creates gig workers with skills)
php artisan db:seed --class=GigWorkerSeeder

# Run admin seeder (if needed)
php artisan db:seed --class=AdminUserSeeder
```

### 2. Run All Seeders

```bash
# This will run AdminUserSeeder, EmployerSeeder, and GigWorkerSeeder
php artisan db:seed
```

### 3. Fresh Migration with Seeders

```bash
# Reset database and run all seeders
php artisan migrate:fresh --seed
```

## Test Accounts Created

### Employer Accounts
All employer passwords: `password123`

1. **maria.santos@techstartup.ph** - TechStart Philippines (Tech startup)
2. **john.delacruz@digitalagency.com** - Digital Solutions Agency (Marketing agency)
3. **ana.rodriguez@ecommerce.ph** - E-Commerce Plus (Online retail)
4. **robert.lim@consulting.ph** - Business Consulting Pro (Consulting)
5. **lisa.tan@restaurant.ph** - Filipino Flavors Restaurant Chain (Restaurant)

### Gig Worker Accounts
All gig worker passwords: `password123`

1. **carlos.mendoza@developer.ph** - Senior Full-Stack Developer (Expert level)
2. **michelle.garcia@webdev.ph** - Full-Stack Web Developer (Intermediate)
3. **james.reyes@mobiledev.ph** - React Native Developer (Intermediate)
4. **sarah.cruz@flutter.ph** - Flutter Developer (Intermediate)
5. **mark.villanueva@design.ph** - Brand Identity Designer (Intermediate)
6. **jenny.flores@socialmedia.ph** - Social Media Designer (Beginner)
7. **patricia.santos@writer.ph** - Content Writer & SEO (Intermediate)
8. **rico.delarosa@marketing.ph** - Digital Marketing Specialist (Expert)
9. **grace.morales@va.ph** - Virtual Assistant (Intermediate)
10. **daniel.aquino@dataentry.ph** - Data Entry Specialist (Beginner)
11. **mariaelena.ramos@accounting.ph** - CPA & Bookkeeper (Expert)
12. **kevin.bautista@wordpress.ph** - WordPress Developer (Intermediate)
13. **sophia.hernandez@ux.ph** - UI/UX Designer (Intermediate)
14. **miguel.torres@video.ph** - Video Editor (Intermediate)
15. **anna.perez@junior.dev.ph** - Junior Web Developer (Beginner)

## Job Categories Created

### Technology Jobs
- Full-Stack Web Development (Laravel, Vue.js, PHP, MySQL)
- Mobile App Development (React Native, Flutter)
- WordPress Development with SEO

### Design Jobs
- Brand Identity Design
- Social Media Graphics and Content Creation

### Marketing Jobs
- Content Writing and SEO
- Digital Marketing and Local SEO

### Administrative Jobs
- Virtual Assistant and Customer Service
- Data Entry and Database Management

### Specialized Jobs
- Accounting and Bookkeeping (CPA level)

## Testing AI Recommendations

### 1. Login as a Gig Worker

```
Email: carlos.mendoza@developer.ph
Password: password123
```

Navigate to: `/ai/recommendations`

**Expected Results:**
- Should see job recommendations ranked by match score
- High scores (80-100%) for full-stack development jobs
- Medium scores (60-79%) for related tech jobs
- Lower scores for non-tech jobs

### 2. Login as an Employer

```
Email: maria.santos@techstartup.ph
Password: password123
```

Navigate to: `/ai/recommendations`

**Expected Results:**
- Should see gig worker recommendations for posted jobs
- Carlos Mendoza should score highly for tech jobs
- Michelle Garcia should score well for web development
- Lower scores for non-matching skill sets

### 3. Skills Matching Examples

**Perfect Matches (90-100% scores):**
- Carlos Mendoza + Full-Stack Web Developer jobs
- Rico Dela Rosa + Digital Marketing jobs
- Maria Elena Ramos + Accounting jobs

**Good Matches (70-89% scores):**
- Michelle Garcia + WordPress development
- James Reyes + Mobile app projects
- Mark Villanueva + Brand identity work

**Partial Matches (50-69% scores):**
- Kevin Bautista + General web development
- Patricia Santos + Content marketing
- Sophia Hernandez + UI/UX projects

## AI Recommendation Features

### Match Scoring Algorithm

The system uses a comprehensive scoring algorithm:

1. **Skills Matching (60% weight)**
   - Direct skill matches: 100% value
   - Partial skill matches: 50% value
   - Related skills bonus: 20% bonus

2. **Experience Level (40% weight)**
   - Perfect match: 100% score
   - One level difference: 75% score
   - Two+ levels difference: 50% score

### Fallback System

If OpenRouter AI is not configured, the system uses:
- Keyword-based skill matching
- Experience level comparison
- Generous scoring to ensure matches are found

### Caching

- Match scores are cached for 24 hours
- Improves performance for repeated requests
- Cache key: `match_score_{job_id}_{gig_worker_id}`

## Troubleshooting

### No Recommendations Showing

1. **Check user types:**
   ```sql
   SELECT email, user_type FROM users WHERE user_type IN ('employer', 'gig_worker');
   ```

2. **Check job status:**
   ```sql
   SELECT title, status FROM gig_jobs WHERE status = 'open';
   ```

3. **Check skills data:**
   ```sql
   SELECT email, skills FROM users WHERE user_type = 'gig_worker' AND skills IS NOT NULL;
   ```

### Low Match Scores

This is normal and expected! The algorithm is designed to be realistic:
- 80-100%: Excellent matches (rare)
- 60-79%: Good matches
- 40-59%: Fair matches
- 20-39%: Potential matches
- 0-19%: Poor matches

### AI API Issues

If OpenRouter API is not configured:
1. The system automatically falls back to keyword matching
2. Check logs: `storage/logs/laravel.log`
3. Scores will still be generated using the fallback algorithm

## Database Structure

### Key Tables
- `users` - Employers and gig workers
- `gig_jobs` - Job postings
- `bids` - Proposals from gig workers

### Important Fields
- `users.skills` - JSON array of skills
- `users.experience_level` - beginner/intermediate/expert
- `gig_jobs.required_skills` - JSON array of required skills
- `gig_jobs.status` - open/closed/in_progress/completed

## Next Steps

1. **Test the matching system** with different user combinations
2. **Adjust scoring weights** in `MatchService.php` if needed
3. **Add more job categories** by extending the seeders
4. **Configure OpenRouter API** for enhanced AI matching
5. **Monitor performance** and optimize caching as needed

## Support

If you encounter issues:
1. Check the Laravel logs: `storage/logs/laravel.log`
2. Verify database seeding completed successfully
3. Test with different user accounts
4. Check browser console for JavaScript errors

The system is designed to work reliably even without external AI services, providing a solid foundation for job matching functionality.
