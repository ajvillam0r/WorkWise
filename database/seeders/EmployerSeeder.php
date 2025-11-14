<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\GigJob;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample employers with different business types
        $employers = [
            [
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'email' => 'maria.santos@techstartup.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'company_name' => 'TechStart Philippines',
                'bio' => 'CEO of a growing tech startup focused on e-commerce solutions for Filipino businesses.',
                'country' => 'Philippines',
                'city' => 'Makati City',
                'phone' => '+639171234567',
                'work_type_needed' => 'Web Development, Mobile Apps, Digital Marketing',
                'budget_range' => '₱50,000 - ₱200,000',
                'project_intent' => 'Long-term partnerships with skilled developers',
                'escrow_balance' => 150000.00, // ₱150,000.00
            ],
            [
                'first_name' => 'John',
                'last_name' => 'Dela Cruz',
                'email' => 'john.delacruz@digitalagency.com',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'company_name' => 'Digital Solutions Agency',
                'bio' => 'Creative director at a digital marketing agency serving local and international clients.',
                'country' => 'Philippines',
                'city' => 'Cebu City',
                'phone' => '+639181234567',
                'work_type_needed' => 'Graphic Design, Content Writing, Social Media Management',
                'budget_range' => '₱25,000 - ₱100,000',
                'project_intent' => 'Creative projects and ongoing marketing campaigns',
                'escrow_balance' => 75000.00, // ₱75,000.00
            ],
            [
                'first_name' => 'Ana',
                'last_name' => 'Rodriguez',
                'email' => 'ana.rodriguez@ecommerce.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'company_name' => 'E-Commerce Plus',
                'bio' => 'Operations manager for an online retail company expanding across Southeast Asia.',
                'country' => 'Philippines',
                'city' => 'Davao City',
                'phone' => '+639191234567',
                'work_type_needed' => 'Data Entry, Customer Service, Virtual Assistance',
                'budget_range' => '₱15,000 - ₱50,000',
                'project_intent' => 'Operational support and customer service enhancement',
                'escrow_balance' => 100000.00, // ₱100,000.00
            ],
            [
                'first_name' => 'Robert',
                'last_name' => 'Lim',
                'email' => 'robert.lim@consulting.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'company_name' => 'Business Consulting Pro',
                'bio' => 'Senior consultant helping SMEs digitize their operations and improve efficiency.',
                'country' => 'Philippines',
                'city' => 'Quezon City',
                'phone' => '+639201234567',
                'work_type_needed' => 'Business Analysis, Process Automation, Training',
                'budget_range' => '₱75,000 - ₱300,000',
                'project_intent' => 'Strategic consulting and digital transformation projects',
                'escrow_balance' => 200000.00, // ₱200,000.00
            ],
            [
                'first_name' => 'Lisa',
                'last_name' => 'Tan',
                'email' => 'lisa.tan@restaurant.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'company_name' => 'Filipino Flavors Restaurant Chain',
                'bio' => 'Restaurant owner looking to expand online presence and improve customer experience.',
                'country' => 'Philippines',
                'city' => 'Iloilo City',
                'phone' => '+639211234567',
                'work_type_needed' => 'Website Development, Online Ordering System, Photography',
                'budget_range' => '₱30,000 - ₱120,000',
                'project_intent' => 'Digital transformation for restaurant business',
                'escrow_balance' => 80000.00, // ₱80,000.00
            ],
        ];

        foreach ($employers as $employerData) {
            // Check if employer already exists
            $existingEmployer = User::where('email', $employerData['email'])->first();
            
            if ($existingEmployer) {
                $employer = $existingEmployer;
                echo "Employer {$employerData['email']} already exists, skipping creation.\n";
            } else {
                $employer = User::create($employerData);
                echo "Created employer: {$employerData['email']}\n";
            }

            // Create jobs for each employer
            $this->createJobsForEmployer($employer);
        }
    }

    /**
     * Create sample jobs for an employer
     */
    private function createJobsForEmployer(User $employer): void
    {
        $jobTemplates = [
            // Tech/Development Jobs
            [
                'title' => 'Full-Stack Web Developer for E-commerce Platform',
                'description' => 'We are looking for an experienced full-stack developer to build a comprehensive e-commerce platform for Filipino businesses. The project involves creating a modern, responsive website with payment integration, inventory management, and customer portal features. Must have experience with Philippine payment gateways like PayMaya, GCash, and traditional banking systems.',
                'required_skills' => ['PHP', 'Laravel', 'JavaScript', 'Vue.js', 'MySQL', 'Payment Integration', 'API Development'],
                'budget_type' => 'fixed',
                'budget_min' => 80000,
                'budget_max' => 120000,
                'experience_level' => 'expert',
                'estimated_duration_days' => 45,
                'is_remote' => true,
            ],
            [
                'title' => 'Mobile App Developer - React Native',
                'description' => 'Seeking a skilled React Native developer to create a mobile application for our food delivery service. The app should include user authentication, real-time order tracking, push notifications, and integration with local payment methods. Experience with Filipino market preferences and local delivery logistics is a plus.',
                'required_skills' => ['React Native', 'JavaScript', 'Firebase', 'Push Notifications', 'Mobile UI/UX', 'API Integration'],
                'budget_type' => 'fixed',
                'budget_min' => 60000,
                'budget_max' => 90000,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 35,
                'is_remote' => true,
            ],
            [
                'title' => 'WordPress Website Development and SEO',
                'description' => 'Looking for a WordPress expert to develop a professional business website with SEO optimization. The site should be mobile-responsive, fast-loading, and optimized for Philippine search terms. Include contact forms, service pages, blog functionality, and integration with social media platforms popular in the Philippines.',
                'required_skills' => ['WordPress', 'PHP', 'SEO', 'Responsive Design', 'Google Analytics', 'Social Media Integration'],
                'budget_type' => 'fixed',
                'budget_min' => 25000,
                'budget_max' => 45000,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 20,
                'is_remote' => true,
            ],

            // Design Jobs
            [
                'title' => 'Brand Identity Design for Filipino Restaurant',
                'description' => 'Create a complete brand identity for a new Filipino restaurant chain. This includes logo design, color palette, typography, menu design, signage concepts, and social media templates. The design should reflect Filipino culture while appealing to modern consumers. Experience with food industry branding preferred.',
                'required_skills' => ['Graphic Design', 'Logo Design', 'Brand Identity', 'Adobe Creative Suite', 'Typography', 'Print Design'],
                'budget_type' => 'fixed',
                'budget_min' => 35000,
                'budget_max' => 55000,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 25,
                'is_remote' => true,
            ],
            [
                'title' => 'Social Media Graphics and Content Creation',
                'description' => 'Need a creative designer to produce engaging social media content for our digital marketing campaigns. Create graphics for Facebook, Instagram, TikTok, and LinkedIn that resonate with Filipino audiences. Include promotional materials, infographics, and animated posts. Knowledge of current Filipino social media trends essential.',
                'required_skills' => ['Social Media Design', 'Canva', 'Adobe Photoshop', 'Content Creation', 'Animation', 'Filipino Culture'],
                'budget_type' => 'hourly',
                'budget_min' => 300,
                'budget_max' => 500,
                'experience_level' => 'beginner',
                'estimated_duration_days' => 30,
                'is_remote' => true,
            ],

            // Content and Marketing Jobs
            [
                'title' => 'Content Writer - Filipino Business Blog',
                'description' => 'Seeking an experienced content writer to create engaging blog posts about business, entrepreneurship, and digital marketing specifically for Filipino audiences. Must understand local business culture, write in both English and Filipino when appropriate, and have knowledge of SEO best practices for Philippine market.',
                'required_skills' => ['Content Writing', 'SEO Writing', 'Filipino Language', 'Business Writing', 'Research', 'WordPress'],
                'budget_type' => 'hourly',
                'budget_min' => 250,
                'budget_max' => 400,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 60,
                'is_remote' => true,
            ],
            [
                'title' => 'Digital Marketing Specialist - Local SEO',
                'description' => 'Looking for a digital marketing expert to improve our online presence in the Philippine market. Focus on local SEO, Google My Business optimization, social media marketing, and PPC campaigns targeting Filipino consumers. Experience with local search trends and consumer behavior required.',
                'required_skills' => ['Digital Marketing', 'Local SEO', 'Google Ads', 'Facebook Ads', 'Analytics', 'Social Media Marketing'],
                'budget_type' => 'fixed',
                'budget_min' => 40000,
                'budget_max' => 70000,
                'experience_level' => 'expert',
                'estimated_duration_days' => 40,
                'is_remote' => true,
            ],

            // Administrative and Support Jobs
            [
                'title' => 'Virtual Assistant - Customer Service',
                'description' => 'Hiring a reliable virtual assistant to handle customer inquiries, manage emails, schedule appointments, and provide general administrative support. Must be fluent in English and Filipino, have excellent communication skills, and be available during Philippine business hours. Experience with CRM systems preferred.',
                'required_skills' => ['Virtual Assistance', 'Customer Service', 'Email Management', 'CRM Software', 'Communication', 'Time Management'],
                'budget_type' => 'hourly',
                'budget_min' => 200,
                'budget_max' => 350,
                'experience_level' => 'beginner',
                'estimated_duration_days' => 90,
                'is_remote' => true,
            ],
            [
                'title' => 'Data Entry and Database Management',
                'description' => 'Need a detail-oriented professional for data entry tasks and database management. Responsibilities include updating customer information, processing orders, maintaining inventory records, and generating reports. Proficiency in Excel, Google Sheets, and basic database operations required.',
                'required_skills' => ['Data Entry', 'Excel', 'Google Sheets', 'Database Management', 'Attention to Detail', 'Data Analysis'],
                'budget_type' => 'hourly',
                'budget_min' => 180,
                'budget_max' => 280,
                'experience_level' => 'beginner',
                'estimated_duration_days' => 45,
                'is_remote' => true,
            ],

            // Specialized Jobs
            [
                'title' => 'Accounting and Bookkeeping Services',
                'description' => 'Seeking a qualified accountant or bookkeeper to manage financial records for our growing business. Tasks include maintaining books, preparing financial statements, tax preparation, and ensuring compliance with Philippine accounting standards. CPA certification or relevant experience required.',
                'required_skills' => ['Accounting', 'Bookkeeping', 'QuickBooks', 'Tax Preparation', 'Financial Analysis', 'Philippine Tax Law'],
                'budget_type' => 'hourly',
                'budget_min' => 400,
                'budget_max' => 600,
                'experience_level' => 'expert',
                'estimated_duration_days' => 120,
                'is_remote' => true,
            ],
        ];

        // Assign jobs to employers based on their business type
        $employerJobMapping = [
            'TechStart Philippines' => [0, 1, 2], // Tech jobs
            'Digital Solutions Agency' => [3, 4, 5, 6], // Design and marketing jobs
            'E-Commerce Plus' => [7, 8], // Administrative jobs
            'Business Consulting Pro' => [9, 6], // Specialized and marketing jobs
            'Filipino Flavors Restaurant Chain' => [3, 4, 2], // Design and web jobs
        ];

        $jobIndices = $employerJobMapping[$employer->company_name] ?? [0, 1];

        foreach ($jobIndices as $index) {
            if (isset($jobTemplates[$index])) {
                $jobData = $jobTemplates[$index];
                $jobData['employer_id'] = $employer->id;
                $jobData['status'] = 'open';
                $jobData['location'] = $employer->city . ', ' . $employer->country;
                $jobData['deadline'] = now()->addDays($jobData['estimated_duration_days'] + 14);

                // Check if job already exists for this employer
                $existingJob = GigJob::where('employer_id', $employer->id)
                    ->where('title', $jobData['title'])
                    ->first();
                
                if (!$existingJob) {
                    GigJob::create($jobData);
                    echo "Created job: {$jobData['title']} for {$employer->company_name}\n";
                } else {
                    echo "Job '{$jobData['title']}' already exists for {$employer->company_name}, skipping.\n";
                }
            }
        }
    }
}
