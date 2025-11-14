<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\GigJob;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CleanWorkWiseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Clean WorkWise Seeder...');
        
        // Create 3 gig workers
        $gigWorkers = $this->createGigWorkers();
        $this->command->info('✅ Created ' . count($gigWorkers) . ' gig workers');
        
        // Create 3 employers
        $employers = $this->createEmployers();
        $this->command->info('✅ Created ' . count($employers) . ' employers');
        
        // Create jobs for employers
        $jobs = $this->createJobsForEmployers($employers);
        $this->command->info('✅ Created ' . count($jobs) . ' jobs');
        
        $this->command->info('🎉 Clean WorkWise seeding completed successfully!');
        $this->command->info('');
        $this->command->info('📧 Test Accounts:');
        $this->command->info('');
        $this->command->info('Gig Workers:');
        $this->command->info('  1. carlos.dev@workwise.ph (password123) - Full-Stack Developer');
        $this->command->info('  2. maria.design@workwise.ph (password123) - UI/UX Designer');
        $this->command->info('  3. juan.writer@workwise.ph (password123) - Content Writer');
        $this->command->info('');
        $this->command->info('Employers:');
        $this->command->info('  1. tech.startup@workwise.ph (password123) - Tech Startup');
        $this->command->info('  2. creative.agency@workwise.ph (password123) - Creative Agency');
        $this->command->info('  3. ecommerce.business@workwise.ph (password123) - E-Commerce Business');
    }

    private function createGigWorkers(): array
    {
        $gigWorkers = [
            // Gig Worker 1: Full-Stack Developer (Expert Level)
            [
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'email' => 'carlos.dev@workwise.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'email_verified_at' => now(),
                'professional_title' => 'Senior Full-Stack Developer',
                'bio' => 'Experienced full-stack developer with 6+ years of expertise in building scalable web applications. Specialized in e-commerce platforms, API development, and cloud infrastructure. Passionate about clean code and modern development practices. Successfully delivered 50+ projects for clients across various industries.',
                'country' => 'Philippines',
                'city' => 'Makati City',
                'street_address' => '123 Ayala Avenue',
                'postal_code' => '1200',
                'phone' => '+639171234501',
                'hourly_rate' => 850.00,
                'broad_category' => 'Programming & Tech',
                'specific_services' => ['Web Development', 'E-commerce Development', 'API Integration & Automation', 'Database Management'],
                'skills_with_experience' => [
                    ['skill' => 'HTML', 'experience_level' => 'expert'],
                    ['skill' => 'CSS', 'experience_level' => 'expert'],
                    ['skill' => 'JavaScript', 'experience_level' => 'expert'],
                    ['skill' => 'React', 'experience_level' => 'expert'],
                    ['skill' => 'Vue.js', 'experience_level' => 'expert'],
                    ['skill' => 'Next.js', 'experience_level' => 'expert'],
                    ['skill' => 'PHP', 'experience_level' => 'expert'],
                    ['skill' => 'Laravel', 'experience_level' => 'expert'],
                    ['skill' => 'Node.js', 'experience_level' => 'expert'],
                    ['skill' => 'Express', 'experience_level' => 'expert'],
                    ['skill' => 'MySQL', 'experience_level' => 'expert'],
                    ['skill' => 'PostgreSQL', 'experience_level' => 'expert'],
                    ['skill' => 'MongoDB', 'experience_level' => 'expert'],
                    ['skill' => 'REST API', 'experience_level' => 'expert'],
                    ['skill' => 'GraphQL', 'experience_level' => 'expert'],
                    ['skill' => 'Shopify', 'experience_level' => 'intermediate'],
                    ['skill' => 'WooCommerce', 'experience_level' => 'intermediate'],
                    ['skill' => 'Stripe API', 'experience_level' => 'expert'],
                ],
                'working_hours' => ['Monday-Friday: 9AM-6PM PHT', 'Flexible for urgent tasks'],
                'timezone' => 'Asia/Manila',
                'preferred_communication' => ['Email', 'Slack', 'Zoom'],
                'availability_notes' => 'Available for full-time or part-time projects. Can accommodate different time zones for international clients.',
                'portfolio_link' => 'https://github.com/carlosmendoza',
                'tutorial_completed' => true,
                'onboarding_step' => 5,
            ],

            // Gig Worker 2: UI/UX Designer (Intermediate Level)
            [
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'email' => 'maria.design@workwise.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'email_verified_at' => now(),
                'professional_title' => 'UI/UX Designer & Brand Specialist',
                'bio' => 'Creative UI/UX designer with 4 years of experience crafting beautiful and intuitive digital experiences. Specialized in mobile app design, web interfaces, and brand identity. Strong understanding of user psychology and Filipino market preferences. Worked with startups and established businesses to create designs that convert.',
                'country' => 'Philippines',
                'city' => 'Quezon City',
                'street_address' => '456 Commonwealth Avenue',
                'postal_code' => '1121',
                'phone' => '+639181234502',
                'hourly_rate' => 550.00,
                'broad_category' => 'Creative & Design Services',
                'specific_services' => ['UI/UX Design', 'Graphic Design', 'Logo Design & Branding', 'Web Design'],
                'skills_with_experience' => [
                    ['skill' => 'Figma', 'experience_level' => 'expert'],
                    ['skill' => 'Adobe XD', 'experience_level' => 'intermediate'],
                    ['skill' => 'Wireframing', 'experience_level' => 'expert'],
                    ['skill' => 'Prototyping', 'experience_level' => 'expert'],
                    ['skill' => 'User Research', 'experience_level' => 'intermediate'],
                    ['skill' => 'Usability Testing', 'experience_level' => 'intermediate'],
                    ['skill' => 'Adobe Photoshop', 'experience_level' => 'expert'],
                    ['skill' => 'Illustrator', 'experience_level' => 'intermediate'],
                    ['skill' => 'Canva', 'experience_level' => 'expert'],
                    ['skill' => 'Typography', 'experience_level' => 'intermediate'],
                    ['skill' => 'Branding', 'experience_level' => 'intermediate'],
                    ['skill' => 'Logo Creation', 'experience_level' => 'intermediate'],
                    ['skill' => 'Color Theory', 'experience_level' => 'intermediate'],
                    ['skill' => 'Responsive Design', 'experience_level' => 'expert'],
                ],
                'working_hours' => ['Monday-Saturday: 10AM-7PM PHT'],
                'timezone' => 'Asia/Manila',
                'preferred_communication' => ['Email', 'Telegram', 'Google Meet'],
                'availability_notes' => 'Available for project-based work. Prefer 2-3 week notice for large projects.',
                'portfolio_link' => 'https://behance.net/mariasantos',
                'tutorial_completed' => true,
                'onboarding_step' => 5,
            ],

            // Gig Worker 3: Content Writer & SEO Specialist (Intermediate Level)
            [
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'email' => 'juan.writer@workwise.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'email_verified_at' => now(),
                'professional_title' => 'Content Writer & SEO Specialist',
                'bio' => 'Professional content writer and SEO specialist with 3+ years of experience creating engaging content for Filipino and international audiences. Expert in blog writing, copywriting, and SEO optimization. Bilingual in English and Filipino. Helped numerous businesses improve their online visibility and engagement through strategic content.',
                'country' => 'Philippines',
                'city' => 'Cebu City',
                'street_address' => '789 Osmena Boulevard',
                'postal_code' => '6000',
                'phone' => '+639191234503',
                'hourly_rate' => 420.00,
                'broad_category' => 'Writing & Translation',
                'specific_services' => ['Article & Blog Writing', 'Copywriting', 'Technical Writing', 'Proofreading & Editing'],
                'skills_with_experience' => [
                    ['skill' => 'SEO Writing', 'experience_level' => 'expert'],
                    ['skill' => 'Keyword Research', 'experience_level' => 'expert'],
                    ['skill' => 'Grammar', 'experience_level' => 'expert'],
                    ['skill' => 'Research Skills', 'experience_level' => 'expert'],
                    ['skill' => 'Ad Copy', 'experience_level' => 'intermediate'],
                    ['skill' => 'Brand Voice', 'experience_level' => 'intermediate'],
                    ['skill' => 'Persuasive Writing', 'experience_level' => 'intermediate'],
                    ['skill' => 'Call to Action', 'experience_level' => 'intermediate'],
                    ['skill' => 'API Documentation', 'experience_level' => 'beginner'],
                    ['skill' => 'User Manuals', 'experience_level' => 'beginner'],
                    ['skill' => 'Markdown', 'experience_level' => 'intermediate'],
                    ['skill' => 'Spelling', 'experience_level' => 'expert'],
                    ['skill' => 'Punctuation', 'experience_level' => 'expert'],
                    ['skill' => 'Style Consistency', 'experience_level' => 'expert'],
                ],
                'working_hours' => ['Monday-Friday: 8AM-5PM PHT', 'Weekend availability upon request'],
                'timezone' => 'Asia/Manila',
                'preferred_communication' => ['Email', 'Skype', 'WhatsApp'],
                'availability_notes' => 'Available for ongoing content projects and one-time assignments. Fast turnaround time.',
                'portfolio_link' => 'https://medium.com/@juandelacruz',
                'tutorial_completed' => true,
                'onboarding_step' => 5,
            ],
        ];

        $createdWorkers = [];
        foreach ($gigWorkers as $workerData) {
            $existing = User::where('email', $workerData['email'])->first();
            if (!$existing) {
                $createdWorkers[] = User::create($workerData);
            } else {
                $this->command->warn("Gig worker {$workerData['email']} already exists, skipping.");
                $createdWorkers[] = $existing;
            }
        }

        return $createdWorkers;
    }

    private function createEmployers(): array
    {
        $employers = [
            // Employer 1: Tech Startup
            [
                'first_name' => 'Robert',
                'last_name' => 'Tan',
                'email' => 'tech.startup@workwise.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'email_verified_at' => now(),
                'company_name' => 'InnovateTech Solutions',
                'bio' => 'CEO and founder of InnovateTech Solutions, a fast-growing technology startup focused on developing innovative SaaS products for the Philippine market. We are building a team of talented developers and designers to help us scale our platform and reach more customers.',
                'country' => 'Philippines',
                'city' => 'Taguig City',
                'street_address' => '321 BGC Corporate Center',
                'postal_code' => '1634',
                'phone' => '+639201234501',
                'company_size' => '11-50',
                'industry' => 'Technology',
                'company_website' => 'https://innovatetech.ph',
                'company_description' => 'InnovateTech Solutions is a technology company specializing in cloud-based business management software. We help Filipino SMEs digitize their operations and improve efficiency through our innovative platform.',
                'primary_hiring_needs' => ['Web Development', 'Mobile App Development', 'UI/UX Design', 'DevOps'],
                'typical_project_budget' => '10000+',
                'typical_project_duration' => 'medium_term',
                'preferred_experience_level' => 'intermediate',
                'hiring_frequency' => 'regular',
                'work_type_needed' => 'Full-Stack Development, Mobile Apps, UI/UX Design',
                'budget_range' => '₱50,000 - ₱200,000',
                'project_intent' => 'Building long-term partnerships with skilled developers and designers for ongoing product development',
                'escrow_balance' => 250000.00,
                'tutorial_completed' => true,
                'onboarding_step' => 5,
            ],

            // Employer 2: Creative Agency
            [
                'first_name' => 'Sofia',
                'last_name' => 'Reyes',
                'email' => 'creative.agency@workwise.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'email_verified_at' => now(),
                'company_name' => 'Creative Minds Agency',
                'bio' => 'Creative Director at Creative Minds Agency, a full-service digital marketing and design agency. We work with brands to create compelling visual identities and engaging content that resonates with Filipino audiences. Always looking for talented creatives to collaborate with.',
                'country' => 'Philippines',
                'city' => 'Pasig City',
                'street_address' => '654 Ortigas Center',
                'postal_code' => '1605',
                'phone' => '+639211234502',
                'company_size' => '2-10',
                'industry' => 'Marketing & Advertising',
                'company_website' => 'https://creativeminds.ph',
                'company_description' => 'Creative Minds Agency is a boutique creative agency specializing in brand identity, digital marketing, and content creation. We help businesses tell their stories through compelling design and strategic marketing.',
                'primary_hiring_needs' => ['Graphic Design', 'Content Writing', 'Video Editing', 'Social Media Marketing'],
                'typical_project_budget' => '5000-10000',
                'typical_project_duration' => 'short_term',
                'preferred_experience_level' => 'intermediate',
                'hiring_frequency' => 'regular',
                'work_type_needed' => 'Graphic Design, Content Writing, Video Production, Social Media Management',
                'budget_range' => '₱20,000 - ₱100,000',
                'project_intent' => 'Collaborating with creative professionals for client projects and campaigns',
                'escrow_balance' => 150000.00,
                'tutorial_completed' => true,
                'onboarding_step' => 5,
            ],

            // Employer 3: E-Commerce Business
            [
                'first_name' => 'Michael',
                'last_name' => 'Garcia',
                'email' => 'ecommerce.business@workwise.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'active',
                'email_verified_at' => now(),
                'company_name' => 'ShopPH Online Store',
                'bio' => 'Operations Manager at ShopPH, one of the fastest-growing e-commerce platforms in the Philippines. We are expanding our online presence and need talented professionals to help us improve our website, create engaging content, and manage our growing customer base.',
                'country' => 'Philippines',
                'city' => 'Manila',
                'street_address' => '987 Binondo Street',
                'postal_code' => '1006',
                'phone' => '+639221234503',
                'company_size' => '51-200',
                'industry' => 'E-Commerce & Retail',
                'company_website' => 'https://shopph.com',
                'company_description' => 'ShopPH is a leading e-commerce platform offering a wide range of products to Filipino consumers. We are committed to providing excellent customer service and a seamless shopping experience.',
                'primary_hiring_needs' => ['E-commerce Development', 'Content Writing', 'Virtual Assistance', 'Customer Support'],
                'typical_project_budget' => '5000-10000',
                'typical_project_duration' => 'medium_term',
                'preferred_experience_level' => 'beginner',
                'hiring_frequency' => 'occasional',
                'work_type_needed' => 'Website Development, Content Creation, Customer Service, Data Entry',
                'budget_range' => '₱30,000 - ₱150,000',
                'project_intent' => 'Hiring support staff and developers to scale our e-commerce operations',
                'escrow_balance' => 180000.00,
                'tutorial_completed' => true,
                'onboarding_step' => 5,
            ],
        ];

        $createdEmployers = [];
        foreach ($employers as $employerData) {
            $existing = User::where('email', $employerData['email'])->first();
            if (!$existing) {
                $createdEmployers[] = User::create($employerData);
            } else {
                $this->command->warn("Employer {$employerData['email']} already exists, skipping.");
                $createdEmployers[] = $existing;
            }
        }

        return $createdEmployers;
    }

    private function createJobsForEmployers(array $employers): array
    {
        $jobsData = [
            // Jobs for InnovateTech Solutions (Tech Startup)
            [
                'employer_index' => 0,
                'title' => 'Full-Stack Developer for SaaS Platform',
                'description' => "We are looking for an experienced full-stack developer to join our team and help build our cloud-based business management platform. \n\nResponsibilities:\n- Develop and maintain web application features using Laravel and Vue.js\n- Build RESTful APIs for mobile and web clients\n- Implement secure authentication and authorization systems\n- Optimize database queries and application performance\n- Collaborate with UI/UX designers to implement responsive designs\n- Write clean, maintainable, and well-documented code\n\nRequirements:\n- 3+ years of experience in full-stack development\n- Strong proficiency in PHP, Laravel, JavaScript, and Vue.js\n- Experience with MySQL or PostgreSQL databases\n- Knowledge of RESTful API design and implementation\n- Familiarity with Git version control\n- Good communication skills in English\n\nBonus:\n- Experience with cloud platforms (AWS, Google Cloud)\n- Knowledge of Docker and containerization\n- Experience with payment gateway integration\n\nThis is a great opportunity to work on a growing SaaS product and make a real impact on Filipino businesses.",
                'required_skills' => ['PHP', 'Laravel', 'JavaScript', 'Vue.js', 'MySQL', 'REST API', 'HTML', 'CSS'],
                'budget_type' => 'fixed',
                'budget_min' => 80000,
                'budget_max' => 120000,
                'experience_level' => 'expert',
                'estimated_duration_days' => 60,
                'is_remote' => true,
                'status' => 'open',
            ],
            [
                'employer_index' => 0,
                'title' => 'UI/UX Designer for Mobile App',
                'description' => "We need a talented UI/UX designer to create an intuitive and beautiful mobile app interface for our business management platform.\n\nResponsibilities:\n- Design user-friendly mobile app interfaces for iOS and Android\n- Create wireframes, prototypes, and high-fidelity mockups\n- Conduct user research and usability testing\n- Develop a consistent design system and style guide\n- Collaborate with developers to ensure design implementation\n- Iterate designs based on user feedback and analytics\n\nRequirements:\n- 2+ years of experience in UI/UX design\n- Proficiency in Figma or Adobe XD\n- Strong portfolio showcasing mobile app designs\n- Understanding of iOS and Android design guidelines\n- Knowledge of user-centered design principles\n- Excellent visual design skills\n\nBonus:\n- Experience designing for Filipino users\n- Knowledge of accessibility standards\n- Basic understanding of front-end development\n\nJoin us in creating a product that helps Filipino businesses succeed!",
                'required_skills' => ['Figma', 'Adobe XD', 'Wireframing', 'Prototyping', 'User Research', 'Responsive Design'],
                'budget_type' => 'fixed',
                'budget_min' => 45000,
                'budget_max' => 70000,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 30,
                'is_remote' => true,
                'status' => 'open',
            ],

            // Jobs for Creative Minds Agency
            [
                'employer_index' => 1,
                'title' => 'Brand Identity Designer for Restaurant Chain',
                'description' => "Our client, a new Filipino restaurant chain, needs a complete brand identity package that reflects their modern take on traditional Filipino cuisine.\n\nDeliverables:\n- Logo design (primary and variations)\n- Brand color palette and typography\n- Brand guidelines document\n- Business card and letterhead design\n- Menu design templates\n- Social media templates\n- Signage concepts\n\nRequirements:\n- 3+ years of experience in brand identity design\n- Strong portfolio showcasing brand design projects\n- Proficiency in Adobe Illustrator and Photoshop\n- Understanding of Filipino culture and aesthetics\n- Excellent typography and color theory skills\n- Ability to present and explain design concepts\n\nProject Timeline: 3-4 weeks\n\nWe are looking for a designer who can create a brand that appeals to both traditional and modern Filipino consumers.",
                'required_skills' => ['Logo Creation', 'Branding', 'Adobe Photoshop', 'Illustrator', 'Typography', 'Color Theory', 'Graphic Design'],
                'budget_type' => 'fixed',
                'budget_min' => 40000,
                'budget_max' => 65000,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 25,
                'is_remote' => true,
                'status' => 'open',
            ],
            [
                'employer_index' => 1,
                'title' => 'Content Writer for Tech Blog',
                'description' => "We need an experienced content writer to create engaging blog posts about technology, digital marketing, and business for our agency's website.\n\nResponsibilities:\n- Write 8-10 SEO-optimized blog posts (800-1200 words each)\n- Research trending topics in tech and digital marketing\n- Optimize content for search engines and readability\n- Create compelling headlines and meta descriptions\n- Incorporate relevant keywords naturally\n- Edit and proofread all content\n\nTopics include:\n- Digital marketing strategies for Filipino businesses\n- Web design trends\n- Social media marketing tips\n- E-commerce best practices\n- Technology news and insights\n\nRequirements:\n- 2+ years of experience in content writing\n- Strong SEO writing skills\n- Excellent English grammar and writing style\n- Ability to research and understand technical topics\n- Experience writing for Filipino audiences\n- Portfolio of published articles\n\nProject Duration: 4-6 weeks\n\nThis is a great opportunity for a writer who understands both technology and the Filipino market.",
                'required_skills' => ['SEO Writing', 'Keyword Research', 'Grammar', 'Research Skills', 'Persuasive Writing'],
                'budget_type' => 'fixed',
                'budget_min' => 25000,
                'budget_max' => 40000,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 35,
                'is_remote' => true,
                'status' => 'open',
            ],

            // Jobs for ShopPH Online Store (E-Commerce)
            [
                'employer_index' => 2,
                'title' => 'E-Commerce Website Enhancement',
                'description' => "We need a skilled web developer to enhance our existing e-commerce website with new features and improvements.\n\nTasks:\n- Implement advanced product filtering and search functionality\n- Integrate additional payment gateways (GCash, PayMaya)\n- Optimize website speed and performance\n- Add customer review and rating system\n- Implement wishlist and product comparison features\n- Improve mobile responsiveness\n- Fix existing bugs and issues\n- Add analytics tracking\n\nRequirements:\n- 2+ years of experience in web development\n- Proficiency in PHP and JavaScript\n- Experience with WooCommerce or Shopify\n- Knowledge of payment gateway integration\n- Understanding of e-commerce best practices\n- Experience with website optimization\n\nBonus:\n- Experience with Philippine payment systems\n- Knowledge of Laravel framework\n- SEO optimization skills\n\nProject Duration: 6-8 weeks\n\nHelp us provide a better shopping experience for our customers!",
                'required_skills' => ['PHP', 'JavaScript', 'WooCommerce', 'Shopify', 'Stripe API', 'HTML', 'CSS', 'MySQL'],
                'budget_type' => 'fixed',
                'budget_min' => 55000,
                'budget_max' => 85000,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 50,
                'is_remote' => true,
                'status' => 'open',
            ],
            [
                'employer_index' => 2,
                'title' => 'Product Description Writer',
                'description' => "We are looking for a creative content writer to write compelling product descriptions for our e-commerce website.\n\nResponsibilities:\n- Write engaging product descriptions for 100+ products\n- Create SEO-friendly titles and descriptions\n- Highlight key features and benefits\n- Maintain consistent brand voice\n- Research product specifications and details\n- Optimize content for conversions\n\nProduct Categories:\n- Electronics and gadgets\n- Home and living\n- Fashion and accessories\n- Beauty and personal care\n- Sports and fitness\n\nRequirements:\n- 1+ years of experience in copywriting or content writing\n- Strong persuasive writing skills\n- Understanding of e-commerce and online shopping behavior\n- SEO knowledge\n- Attention to detail\n- Ability to write in a friendly, conversational tone\n\nBonus:\n- Experience writing for Filipino consumers\n- Knowledge of product marketing\n- Familiarity with e-commerce platforms\n\nProject Duration: 3-4 weeks\n\nHelp us showcase our products in the best possible way!",
                'required_skills' => ['Ad Copy', 'Persuasive Writing', 'SEO Writing', 'Grammar', 'Call to Action'],
                'budget_type' => 'fixed',
                'budget_min' => 20000,
                'budget_max' => 35000,
                'experience_level' => 'beginner',
                'estimated_duration_days' => 28,
                'is_remote' => true,
                'status' => 'open',
            ],
        ];

        $createdJobs = [];
        foreach ($jobsData as $jobData) {
            $employerIndex = $jobData['employer_index'];
            unset($jobData['employer_index']);
            
            if (!isset($employers[$employerIndex])) {
                continue;
            }

            $employer = $employers[$employerIndex];
            $jobData['employer_id'] = $employer->id;
            $jobData['location'] = $employer->city . ', ' . $employer->country;
            $jobData['deadline'] = now()->addDays($jobData['estimated_duration_days'] + 14);

            $existing = GigJob::where('employer_id', $employer->id)
                ->where('title', $jobData['title'])
                ->first();
            
            if (!$existing) {
                $createdJobs[] = GigJob::create($jobData);
            } else {
                $this->command->warn("Job '{$jobData['title']}' already exists for employer, skipping.");
                $createdJobs[] = $existing;
            }
        }

        return $createdJobs;
    }
}
