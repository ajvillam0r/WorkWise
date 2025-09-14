<?php

namespace Database\Seeders;

use App\Models\Bid;
use App\Models\GigJob;
use App\Models\User;
use App\Models\Project;
use App\Models\Transaction;
use App\Models\Review;
use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WorkWiseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Creating comprehensive sample data with AI match scores...');

        // Create diverse client accounts
        $client1 = User::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Mactan',
            'user_type' => 'client',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'company_name' => 'Tech Startup Inc',
            'work_type_needed' => 'Web Development',
            'budget_range' => '$5,000 - $10,000',
            'project_intent' => 'We need to build a modern web application for our startup.',
            'bio' => 'We are a fast-growing tech startup looking for talented freelancers.',
            'location' => 'San Francisco, CA',
            'escrow_balance' => 15000.00,
        ]);

        $client2 = User::create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Poblacion',
            'user_type' => 'client',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'company_name' => 'Digital Agency Pro',
            'work_type_needed' => 'UI/UX Design',
            'budget_range' => '$1,000 - $5,000',
            'project_intent' => 'Looking for ongoing design support for our client projects.',
            'bio' => 'Full-service digital agency specializing in web development and design.',
            'location' => 'New York, NY',
            'escrow_balance' => 8500.00,
        ]);

        $client3 = User::create([
            'first_name' => 'Michael',
            'last_name' => 'Chen',
            'email' => 'michael.chen@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Lahug',
            'user_type' => 'client',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'company_name' => 'E-commerce Solutions Ltd',
            'work_type_needed' => 'Mobile Development',
            'budget_range' => '$10,000 - $25,000',
            'project_intent' => 'Building mobile apps for e-commerce businesses.',
            'bio' => 'We help e-commerce businesses expand to mobile platforms.',
            'location' => 'Toronto, Canada',
            'escrow_balance' => 25000.00,
        ]);

        // Create diverse freelancer accounts with different experience levels and skills
        $freelancer1 = User::create([
            'first_name' => 'Maria',
            'last_name' => 'Garcia',
            'email' => 'maria.garcia@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Basak',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Senior Full Stack Developer',
            'experience_level' => 'expert',
            'bio' => 'Full-stack developer with 7+ years of experience in React and Laravel. I specialize in building scalable web applications and have worked with Fortune 500 companies.',
            'location' => 'Remote',
            'hourly_rate' => 85.00,
            'skills' => ['React', 'Laravel', 'JavaScript', 'PHP', 'MySQL', 'Node.js', 'Vue.js', 'PostgreSQL'],
            'languages' => ['English', 'Spanish'],
            'portfolio_url' => 'https://mariagarcia.dev',
        ]);

        $freelancer2 = User::create([
            'first_name' => 'Carlos',
            'last_name' => 'Rodriguez',
            'email' => 'carlos.rodriguez@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Punta Engaño',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Senior UI/UX Designer',
            'experience_level' => 'expert',
            'bio' => 'UI/UX designer with 6+ years of experience creating beautiful and functional designs. I help businesses create engaging digital experiences that convert.',
            'location' => 'Los Angeles, CA',
            'hourly_rate' => 70.00,
            'skills' => ['UI Design', 'UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Wireframing'],
            'languages' => ['English', 'Spanish'],
            'portfolio_url' => 'https://carlosdesigns.com',
        ]);

        $freelancer3 = User::create([
            'first_name' => 'Sarah',
            'last_name' => 'Johnson',
            'email' => 'sarah.johnson@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Agus',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Content Writer & SEO Specialist',
            'experience_level' => 'intermediate',
            'bio' => 'Content writer and copywriter with 4 years of experience specializing in tech and marketing content. I create compelling content that drives results.',
            'location' => 'Chicago, IL',
            'hourly_rate' => 50.00,
            'skills' => ['Content Writing', 'Copywriting', 'SEO', 'Blog Writing', 'Technical Writing', 'Social Media'],
            'languages' => ['English', 'French'],
            'portfolio_url' => 'https://sarahjohnson.writer',
        ]);

        // Beginner freelancer for lower match scores
        $freelancer4 = User::create([
            'first_name' => 'Alex',
            'last_name' => 'Kim',
            'email' => 'alex.kim@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Talamban',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Junior Web Developer',
            'experience_level' => 'beginner',
            'bio' => 'Recent computer science graduate passionate about web development. Eager to learn and grow while delivering quality work.',
            'location' => 'Remote',
            'hourly_rate' => 25.00,
            'skills' => ['HTML', 'CSS', 'JavaScript', 'Bootstrap', 'Git'],
            'languages' => ['English', 'Korean'],
            'portfolio_url' => 'https://alexkim.dev',
        ]);

        // Mobile developer for specific matches
        $freelancer5 = User::create([
            'first_name' => 'Priya',
            'last_name' => 'Patel',
            'email' => 'priya.patel@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'IT Park',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Mobile App Developer',
            'experience_level' => 'expert',
            'bio' => 'Mobile app developer with 8+ years of experience in iOS and Android development. Specialized in e-commerce and fintech apps.',
            'location' => 'Mumbai, India',
            'hourly_rate' => 65.00,
            'skills' => ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Firebase'],
            'languages' => ['English', 'Hindi'],
            'portfolio_url' => 'https://priyapatel.mobile',
        ]);

        // Data scientist for mismatch scenarios
        $freelancer6 = User::create([
            'first_name' => 'David',
            'last_name' => 'Wilson',
            'email' => 'david.wilson@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Banilad',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Data Scientist',
            'experience_level' => 'expert',
            'bio' => 'Data scientist with expertise in machine learning, statistical analysis, and data visualization. 6+ years of experience.',
            'location' => 'Seattle, WA',
            'hourly_rate' => 95.00,
            'skills' => ['Python', 'R', 'Machine Learning', 'Data Analysis', 'SQL', 'Tableau', 'TensorFlow'],
            'languages' => ['English'],
            'portfolio_url' => 'https://davidwilson.data',
        ]);

        // Create diverse job postings for different AI match scenarios
        $this->command->info('📝 Creating job postings with varying requirements...');

        // High match job for Maria (Expert React/Laravel developer)
        $job1 = GigJob::create([
            'employer_id' => $client1->id,
            'title' => 'Senior React & Laravel Developer for E-commerce Platform',
            'description' => 'We need an experienced React and Laravel developer to build a comprehensive e-commerce platform. The project involves creating responsive components, building REST APIs, implementing payment integration, and ensuring scalability.',
            'required_skills' => ['React', 'Laravel', 'JavaScript', 'PHP', 'MySQL', 'REST API'],
            'budget_type' => 'fixed',
            'budget_min' => 6000,
            'budget_max' => 8000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 45,
            'deadline' => now()->addDays(60),
            'is_remote' => true,
        ]);

        // Perfect match job for Carlos (Expert UI/UX Designer)
        $job2 = GigJob::create([
            'employer_id' => $client2->id,
            'title' => 'Senior UI/UX Designer for Mobile App',
            'description' => 'Looking for a talented senior UI/UX designer to create wireframes, user research, and high-fidelity designs for our new mobile application. Must have experience with mobile design patterns, prototyping, and user testing.',
            'required_skills' => ['UI Design', 'UX Design', 'Figma', 'Prototyping', 'User Research', 'Wireframing'],
            'budget_type' => 'hourly',
            'budget_min' => 65,
            'budget_max' => 85,
            'experience_level' => 'expert',
            'estimated_duration_days' => 21,
            'deadline' => now()->addDays(30),
            'is_remote' => true,
        ]);

        // Good match job for Sarah (Intermediate Content Writer)
        $job3 = GigJob::create([
            'employer_id' => $client1->id,
            'title' => 'Content Writer & SEO Specialist for Tech Blog',
            'description' => 'We need a skilled content writer to create engaging blog posts about technology trends, software development, and startup culture. Must be able to research topics, write in an engaging style, and optimize for SEO.',
            'required_skills' => ['Content Writing', 'SEO', 'Technical Writing', 'Blog Writing'],
            'budget_type' => 'fixed',
            'budget_min' => 1200,
            'budget_max' => 1800,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 14,
            'deadline' => now()->addDays(21),
            'is_remote' => true,
        ]);

        // Mobile app job - perfect for Priya
        $job4 = GigJob::create([
            'employer_id' => $client3->id,
            'title' => 'React Native E-commerce Mobile App Development',
            'description' => 'Looking for an expert mobile developer to build a comprehensive e-commerce mobile application using React Native. The app should support both iOS and Android, include payment integration, and have a modern UI.',
            'required_skills' => ['React Native', 'Mobile Development', 'iOS', 'Android', 'Firebase'],
            'budget_type' => 'fixed',
            'budget_min' => 12000,
            'budget_max' => 18000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 60,
            'deadline' => now()->addDays(90),
            'is_remote' => true,
        ]);

        // Beginner-friendly job for Alex
        $job5 = GigJob::create([
            'employer_id' => $client2->id,
            'title' => 'Simple Landing Page Development',
            'description' => 'Need a simple, responsive landing page for our new product. Should be built with HTML, CSS, and basic JavaScript. Perfect for someone starting their career.',
            'required_skills' => ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
            'budget_type' => 'fixed',
            'budget_min' => 300,
            'budget_max' => 600,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 7,
            'deadline' => now()->addDays(14),
            'is_remote' => true,
        ]);

        // Mismatch job - Data Science (no good matches)
        $job6 = GigJob::create([
            'employer_id' => $client1->id,
            'title' => 'Machine Learning Model for Customer Analytics',
            'description' => 'We need a data scientist to build machine learning models for customer behavior analysis. Requires expertise in Python, TensorFlow, and statistical analysis.',
            'required_skills' => ['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis', 'Statistics'],
            'budget_type' => 'hourly',
            'budget_min' => 80,
            'budget_max' => 120,
            'experience_level' => 'expert',
            'estimated_duration_days' => 30,
            'deadline' => now()->addDays(45),
            'is_remote' => true,
        ]);

        // Partial match job - requires some skills but not all
        $job7 = GigJob::create([
            'employer_id' => $client2->id,
            'title' => 'WordPress Website with Custom JavaScript',
            'description' => 'Need to build a WordPress website with custom JavaScript functionality. Some React knowledge would be helpful but not required.',
            'required_skills' => ['WordPress', 'JavaScript', 'PHP', 'CSS'],
            'budget_type' => 'fixed',
            'budget_min' => 1500,
            'budget_max' => 2500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 21,
            'deadline' => now()->addDays(35),
            'is_remote' => true,
        ]);

        $this->command->info('💼 Creating sample bids and projects...');

        // Create sample bids for different scenarios
        Bid::create([
            'job_id' => $job1->id,
            'freelancer_id' => $freelancer1->id,
            'bid_amount' => 7200,
            'proposal_message' => 'Hi! I have extensive experience building React and Laravel applications. I can deliver a high-quality, scalable e-commerce platform that meets all your requirements. My portfolio includes several similar projects.',
            'estimated_days' => 42,
        ]);

        Bid::create([
            'job_id' => $job2->id,
            'freelancer_id' => $freelancer2->id,
            'bid_amount' => 75,
            'proposal_message' => 'Hello! I specialize in mobile UI/UX design and have worked on numerous successful app projects. I can provide user research, wireframes, and pixel-perfect designs that will make your app stand out.',
            'estimated_days' => 20,
        ]);

        $bid3 = Bid::create([
            'job_id' => $job3->id,
            'freelancer_id' => $freelancer3->id,
            'bid_amount' => 1500,
            'proposal_message' => 'I am a professional content writer with a strong background in technology writing. I can create engaging, SEO-optimized blog posts that will help establish your company as a thought leader in the tech space.',
            'estimated_days' => 12,
            'status' => 'accepted',
        ]);

        // Mobile app bid
        Bid::create([
            'job_id' => $job4->id,
            'freelancer_id' => $freelancer5->id,
            'bid_amount' => 15000,
            'proposal_message' => 'I specialize in React Native development and have built several e-commerce mobile apps. I can deliver a high-quality, cross-platform solution with all the features you need.',
            'estimated_days' => 55,
        ]);

        // Beginner job bid
        Bid::create([
            'job_id' => $job5->id,
            'freelancer_id' => $freelancer4->id,
            'bid_amount' => 450,
            'proposal_message' => 'I am a junior developer eager to work on this project. I have solid skills in HTML, CSS, and JavaScript and can deliver a clean, responsive landing page.',
            'estimated_days' => 6,
        ]);

        // Accept one bid and create a completed project
        $bid1 = Bid::where('job_id', $job3->id)->first(); // Content writing project
        $bid1->update(['status' => 'accepted']);
        $job3->update(['status' => 'in_progress']);

        // Create sample completed project with payment released
        $project1 = Project::create([
            'job_id' => $job3->id,
            'client_id' => $client1->id,
            'freelancer_id' => $freelancer3->id,
            'bid_id' => $bid1->id,
            'agreed_amount' => 1500,
            'platform_fee' => 75, // 5% platform fee
            'net_amount' => 1425,
            'status' => 'completed',
            'started_at' => now()->subDays(20),
            'completed_at' => now()->subDays(3),
            'completion_notes' => 'All blog posts delivered on time with excellent quality. Client was very satisfied with the SEO optimization.',
            'client_approved' => true,
            'approved_at' => now()->subDays(2),
            'payment_released' => true,
            'payment_released_at' => now()->subDays(2),
        ]);

        // Create another project that's completed but awaiting client approval (to test auto payment release)
        $bid2 = Bid::where('job_id', $job5->id)->first(); // Landing page project
        $bid2->update(['status' => 'accepted']);
        $job5->update(['status' => 'in_progress']);

        $project2 = Project::create([
            'job_id' => $job5->id,
            'client_id' => $client2->id,
            'freelancer_id' => $freelancer4->id,
            'bid_id' => $bid2->id,
            'agreed_amount' => 450,
            'platform_fee' => 22.50, // 5% platform fee
            'net_amount' => 427.50,
            'status' => 'completed',
            'started_at' => now()->subDays(10),
            'completed_at' => now()->subDays(1),
            'completion_notes' => 'Landing page completed as requested. All responsive features working perfectly.',
            'client_approved' => false, // Not yet approved - ready for testing
            'approved_at' => null,
            'payment_released' => false,
            'payment_released_at' => null,
        ]);

        // Create a third project for Maria that's also awaiting approval
        $bid3 = Bid::where('job_id', $job1->id)->first(); // React & Laravel project
        $bid3->update(['status' => 'accepted']);
        $job1->update(['status' => 'in_progress']);

        $project3 = Project::create([
            'job_id' => $job1->id,
            'client_id' => $client1->id,
            'freelancer_id' => $freelancer1->id,
            'bid_id' => $bid3->id,
            'agreed_amount' => 7200,
            'platform_fee' => 360, // 5% platform fee
            'net_amount' => 6840,
            'status' => 'completed',
            'started_at' => now()->subDays(15),
            'completed_at' => now()->subDays(2),
            'completion_notes' => 'E-commerce platform completed with all requested features. Fully responsive and optimized.',
            'client_approved' => false, // Not yet approved - ready for testing
            'approved_at' => null,
            'payment_released' => false,
            'payment_released_at' => null,
        ]);

        // Create sample transactions
        Transaction::create([
            'project_id' => $project1->id,
            'payer_id' => $client1->id,
            'payee_id' => $freelancer3->id,
            'amount' => 1500,
            'platform_fee' => 75,
            'net_amount' => 1425,
            'type' => 'escrow',
            'status' => 'completed',
            'description' => 'Escrow payment for content writing project',
            'processed_at' => now()->subDays(20),
            'stripe_payment_intent_id' => 'demo_escrow_1',
            'stripe_charge_id' => 'demo_charge_1',
        ]);

        Transaction::create([
            'project_id' => $project1->id,
            'payer_id' => $client1->id,
            'payee_id' => $freelancer3->id,
            'amount' => 1425,
            'platform_fee' => 0,
            'net_amount' => 1425,
            'type' => 'release',
            'status' => 'completed',
            'description' => 'Payment release for completed content writing project',
            'processed_at' => now()->subDays(2),
            'stripe_payment_intent_id' => 'demo_release_1',
        ]);

        // Create escrow transaction for the second project (awaiting approval)
        Transaction::create([
            'project_id' => $project2->id,
            'payer_id' => $client2->id,
            'payee_id' => $freelancer4->id,
            'amount' => 450,
            'platform_fee' => 22.50,
            'net_amount' => 427.50,
            'type' => 'escrow',
            'status' => 'completed',
            'description' => 'Escrow payment for landing page project',
            'processed_at' => now()->subDays(10),
            'stripe_payment_intent_id' => 'demo_escrow_2',
            'stripe_charge_id' => 'demo_charge_2',
        ]);

        // Create escrow transaction for the third project (awaiting approval)
        Transaction::create([
            'project_id' => $project3->id,
            'payer_id' => $client1->id,
            'payee_id' => $freelancer1->id,
            'amount' => 7200,
            'platform_fee' => 360,
            'net_amount' => 6840,
            'type' => 'escrow',
            'status' => 'completed',
            'description' => 'Escrow payment for React & Laravel e-commerce project',
            'processed_at' => now()->subDays(15),
            'stripe_payment_intent_id' => 'demo_escrow_3',
            'stripe_charge_id' => 'demo_charge_3',
        ]);

        // Create sample messages
        Message::create([
            'sender_id' => $client1->id,
            'receiver_id' => $freelancer3->id,
            'project_id' => $project1->id,
            'message' => 'Hi Sarah! I\'m excited to work with you on this content project. When can we start?',
            'type' => 'text',
            'is_read' => true,
            'read_at' => now()->subDays(19),
            'created_at' => now()->subDays(20),
        ]);

        Message::create([
            'sender_id' => $freelancer3->id,
            'receiver_id' => $client1->id,
            'project_id' => $project1->id,
            'message' => 'Hello John! Thank you for choosing me. I can start immediately. I\'ll send you the content outline by tomorrow.',
            'type' => 'text',
            'is_read' => true,
            'read_at' => now()->subDays(19),
            'created_at' => now()->subDays(19),
        ]);

        Message::create([
            'sender_id' => $client1->id,
            'receiver_id' => $freelancer3->id,
            'project_id' => $project1->id,
            'message' => 'Perfect! Looking forward to seeing the content. Please make sure to include SEO optimization as we discussed.',
            'type' => 'text',
            'is_read' => true,
            'read_at' => now()->subDays(18),
            'created_at' => now()->subDays(18),
        ]);

        // Create sample reviews
        Review::create([
            'project_id' => $project1->id,
            'reviewer_id' => $client1->id,
            'reviewee_id' => $freelancer3->id,
            'rating' => 5,
            'comment' => 'Excellent work! Sarah delivered high-quality content that exceeded our expectations. Great SEO optimization and perfect timing.',
            'criteria_ratings' => [
                'communication' => 5,
                'quality' => 5,
                'timeliness' => 5,
            ],
            'is_public' => true,
        ]);

        Review::create([
            'project_id' => $project1->id,
            'reviewer_id' => $freelancer3->id,
            'reviewee_id' => $client1->id,
            'rating' => 5,
            'comment' => 'Great client to work with! Clear requirements, prompt payments, and very professional. Highly recommended!',
            'criteria_ratings' => [
                'communication' => 5,
                'clarity' => 5,
                'payment' => 5,
            ],
            'is_public' => true,
        ]);

        $this->command->info('✅ Comprehensive sample data created successfully!');
        $this->command->info('');
        $this->command->info('🎯 Demo Accounts Created:');
        $this->command->info('');
        $this->command->info('👤 CLIENTS:');
        $this->command->info('   • john.doe@example.com / password (Tech Startup - $15,000 balance)');
        $this->command->info('   • jane.smith@example.com / password (Digital Agency - $8,500 balance)');
        $this->command->info('   • michael.chen@example.com / password (E-commerce - $25,000 balance)');
        $this->command->info('');
        $this->command->info('💼 FREELANCERS:');
        $this->command->info('   • maria.garcia@example.com / password (Expert Full Stack - React/Laravel)');
        $this->command->info('   • carlos.rodriguez@example.com / password (Expert UI/UX Designer)');
        $this->command->info('   • sarah.johnson@example.com / password (Intermediate Content Writer)');
        $this->command->info('   • alex.kim@example.com / password (Beginner Web Developer)');
        $this->command->info('   • priya.patel@example.com / password (Expert Mobile Developer)');
        $this->command->info('   • david.wilson@example.com / password (Expert Data Scientist)');
        $this->command->info('');
        $this->command->info('🤖 AI MATCH SCORE SCENARIOS:');
        $this->command->info('');
        $this->command->info('HIGH MATCHES (85-95%):');
        $this->command->info('   • Maria → React & Laravel E-commerce (Perfect skill match + Expert level)');
        $this->command->info('   • Carlos → Mobile UI/UX Design (Perfect skill match + Expert level)');
        $this->command->info('   • Priya → React Native E-commerce App (Perfect skill match + Expert level)');
        $this->command->info('');
        $this->command->info('GOOD MATCHES (70-84%):');
        $this->command->info('   • Sarah → Content Writing & SEO (Good skill match + Intermediate level)');
        $this->command->info('   • Alex → Simple Landing Page (Perfect skill match but Beginner level)');
        $this->command->info('');
        $this->command->info('PARTIAL MATCHES (50-69%):');
        $this->command->info('   • Maria → WordPress + JavaScript (Some skills match, different tech stack)');
        $this->command->info('   • Alex → React projects (Skill gap, experience mismatch)');
        $this->command->info('');
        $this->command->info('LOW MATCHES (20-49%):');
        $this->command->info('   • David → Web Development jobs (Wrong specialization)');
        $this->command->info('   • Web developers → Data Science jobs (Wrong specialization)');
        $this->command->info('');
        $this->command->info(' SAMPLE DATA INCLUDES:');
        $this->command->info('   • 7 diverse job postings with different requirements');
        $this->command->info('   • 1 completed project with payment released (Sarah\'s content project)');
        $this->command->info('   • 2 completed projects awaiting client approval (Alex\'s landing page & Maria\'s e-commerce)');
        $this->command->info('   • Sample messages, reviews, and bids');
        $this->command->info('   • Freelancers with different experience levels');
        $this->command->info('   • Clients with funded escrow balances');
        $this->command->info('');
        $this->command->info(' PAYMENT TESTING:');
        $this->command->info('   • Log in as jane.smith@example.com to approve Alex\'s completed project (₱427.50)');
        $this->command->info('   • Log in as john.doe@example.com to approve Maria\'s completed project (₱6,840.00)');
        $this->command->info('   • This will test automatic payment release functionality');
        $this->command->info('   • Log in as freelancers to see payments move from pending to available balance');
        $this->command->info('');
        $this->command->info('🚀 Ready to test AI matching! Log in as any freelancer to see personalized job recommendations.');
    }
}
