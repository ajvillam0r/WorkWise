<?php

namespace Database\Seeders;

use App\Models\Bid;
use App\Models\GigJob;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WorkWiseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample users
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
        ]);

        $freelancer1 = User::create([
            'first_name' => 'Maria',
            'last_name' => 'Garcia',
            'email' => 'maria.garcia@example.com',
            'password' => Hash::make('password'),
            'barangay' => 'Basak',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Full Stack Developer',
            'bio' => 'Full-stack developer with 5+ years of experience in React and Laravel. I specialize in building scalable web applications.',
            'location' => 'Remote',
            'hourly_rate' => 75.00,
            'skills' => ['React', 'Laravel', 'JavaScript', 'PHP', 'MySQL'],
            'languages' => ['English', 'Spanish'],
            'portfolio_url' => 'https://johndeveloper.com',
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
            'professional_title' => 'UI/UX Designer',
            'bio' => 'UI/UX designer passionate about creating beautiful and functional designs. I help businesses create engaging digital experiences.',
            'location' => 'Los Angeles, CA',
            'hourly_rate' => 60.00,
            'skills' => ['UI Design', 'UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'],
            'languages' => ['English'],
            'portfolio_url' => 'https://sarahdesigns.com',
        ]);

        $freelancer3 = User::create([
            'first_name' => 'Mike',
            'last_name' => 'Writer',
            'email' => 'mike@writer.com',
            'password' => Hash::make('password'),
            'barangay' => 'Agus',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Content Writer',
            'bio' => 'Content writer and copywriter specializing in tech and marketing content. I create compelling content that drives results.',
            'location' => 'Chicago, IL',
            'hourly_rate' => 45.00,
            'skills' => ['Content Writing', 'Copywriting', 'SEO', 'Blog Writing', 'Technical Writing'],
            'languages' => ['English', 'French'],
        ]);

        // Create sample jobs
        $job1 = GigJob::create([
            'employer_id' => $client1->id,
            'title' => 'React Frontend Developer for E-commerce Platform',
            'description' => 'We need an experienced React developer to build the frontend of our new e-commerce platform. The project involves creating responsive components, integrating with REST APIs, and implementing a modern shopping cart experience.',
            'required_skills' => ['React', 'JavaScript', 'CSS', 'REST API'],
            'budget_type' => 'fixed',
            'budget_min' => 3000,
            'budget_max' => 5000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 30,
            'deadline' => now()->addDays(45),
            'is_remote' => true,
        ]);

        $job2 = GigJob::create([
            'employer_id' => $client2->id,
            'title' => 'UI/UX Design for Mobile App',
            'description' => 'Looking for a talented UI/UX designer to create wireframes and high-fidelity designs for our new mobile application. Must have experience with mobile design patterns and user research.',
            'required_skills' => ['UI Design', 'UX Design', 'Figma', 'Mobile Design'],
            'budget_type' => 'hourly',
            'budget_min' => 50,
            'budget_max' => 80,
            'experience_level' => 'expert',
            'estimated_duration_days' => 21,
            'deadline' => now()->addDays(30),
            'is_remote' => true,
        ]);

        $job3 = GigJob::create([
            'employer_id' => $client1->id,
            'title' => 'Content Writer for Tech Blog',
            'description' => 'We need a skilled content writer to create engaging blog posts about technology trends, software development, and startup culture. Must be able to research topics and write in an engaging, accessible style.',
            'required_skills' => ['Content Writing', 'SEO', 'Tech Writing', 'Research'],
            'budget_type' => 'fixed',
            'budget_min' => 800,
            'budget_max' => 1200,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 14,
            'deadline' => now()->addDays(21),
            'is_remote' => true,
        ]);

        // Create sample bids
        Bid::create([
            'job_id' => $job1->id,
            'freelancer_id' => $freelancer1->id,
            'bid_amount' => 4200,
            'proposal_message' => 'Hi! I have extensive experience building React applications and e-commerce platforms. I can deliver a high-quality, responsive frontend that meets all your requirements. My portfolio includes several similar projects.',
            'estimated_days' => 28,
        ]);

        Bid::create([
            'job_id' => $job2->id,
            'freelancer_id' => $freelancer2->id,
            'bid_amount' => 65,
            'proposal_message' => 'Hello! I specialize in mobile UI/UX design and have worked on numerous successful app projects. I can provide user research, wireframes, and pixel-perfect designs that will make your app stand out.',
            'estimated_days' => 20,
        ]);

        $bid3 = Bid::create([
            'job_id' => $job3->id,
            'freelancer_id' => $freelancer3->id,
            'bid_amount' => 1000,
            'proposal_message' => 'I am a professional content writer with a strong background in technology writing. I can create engaging, SEO-optimized blog posts that will help establish your company as a thought leader in the tech space.',
            'estimated_days' => 12,
            'status' => 'accepted',
        ]);

        // Accept one bid and create a project
        $bid1 = Bid::where('job_id', $job1->id)->first();
        $bid1->update(['status' => 'accepted']);
        $job1->update(['status' => 'in_progress']);

        // Create sample project
        $project1 = \App\Models\Project::create([
            'job_id' => $job1->id,
            'client_id' => $client1->id,
            'freelancer_id' => $freelancer1->id,
            'accepted_bid_id' => $bid1->id,
            'agreed_amount' => 4200,
            'agreed_duration_days' => 28,
            'status' => 'completed',
            'started_at' => now()->subDays(35),
            'deadline' => now()->subDays(7),
            'completed_at' => now()->subDays(5),
            'completion_notes' => 'Project completed successfully with all requirements met. Client was very satisfied.',
            'payment_released' => true,
        ]);

        // Create sample transactions
        \App\Models\Transaction::create([
            'project_id' => $project1->id,
            'payer_id' => $client1->id,
            'payee_id' => $freelancer1->id,
            'amount' => 4200,
            'platform_fee' => 210,
            'net_amount' => 3990,
            'type' => 'escrow',
            'status' => 'completed',
            'description' => 'Escrow payment for React e-commerce project',
            'processed_at' => now()->subDays(35),
        ]);

        \App\Models\Transaction::create([
            'project_id' => $project1->id,
            'payer_id' => $client1->id,
            'payee_id' => $freelancer1->id,
            'amount' => 3990,
            'platform_fee' => 0,
            'net_amount' => 3990,
            'type' => 'release',
            'status' => 'completed',
            'description' => 'Payment release for completed React e-commerce project',
            'processed_at' => now()->subDays(5),
        ]);

        // Create sample messages
        \App\Models\Message::create([
            'sender_id' => $client1->id,
            'receiver_id' => $freelancer1->id,
            'project_id' => $project1->id,
            'message' => 'Hi Maria! I\'m excited to work with you on this project. When can we start?',
            'type' => 'text',
            'is_read' => true,
            'read_at' => now()->subDays(34),
            'created_at' => now()->subDays(35),
        ]);

        \App\Models\Message::create([
            'sender_id' => $freelancer1->id,
            'receiver_id' => $client1->id,
            'project_id' => $project1->id,
            'message' => 'Hello John! Thank you for choosing me. I can start immediately. I\'ll send you the initial wireframes by tomorrow.',
            'type' => 'text',
            'is_read' => true,
            'read_at' => now()->subDays(34),
            'created_at' => now()->subDays(34),
        ]);

        \App\Models\Message::create([
            'sender_id' => $client1->id,
            'receiver_id' => $freelancer1->id,
            'project_id' => $project1->id,
            'message' => 'Perfect! Looking forward to seeing the wireframes. Please make sure to include the shopping cart functionality we discussed.',
            'type' => 'text',
            'is_read' => true,
            'read_at' => now()->subDays(33),
            'created_at' => now()->subDays(33),
        ]);

        // Create sample reviews
        \App\Models\Review::create([
            'project_id' => $project1->id,
            'reviewer_id' => $client1->id,
            'reviewee_id' => $freelancer1->id,
            'rating' => 5,
            'comment' => 'Excellent work! Maria delivered exactly what we needed and even added some extra features. Great communication throughout the project.',
            'criteria_ratings' => [
                'communication' => 5,
                'quality' => 5,
                'timeliness' => 5,
            ],
            'is_public' => true,
        ]);

        \App\Models\Review::create([
            'project_id' => $project1->id,
            'reviewer_id' => $freelancer1->id,
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

        $this->command->info('✅ Sample data created successfully!');
        $this->command->info('🎯 Demo users created:');
        $this->command->info('👤 Client: john.doe@example.com / password');
        $this->command->info('👤 Client: jane.smith@example.com / password');
        $this->command->info('💼 Freelancer: maria.garcia@example.com / password');
        $this->command->info('💼 Freelancer: carlos.rodriguez@example.com / password');
        $this->command->info('📊 Complete project with transactions, messages, and reviews created!');
    }
}
