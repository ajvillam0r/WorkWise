<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\GigJob;
use App\Models\Bid;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WorkWiseComprehensiveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting WorkWise Comprehensive Seeder...');
        
        // Create employers first
        $employers = $this->createEmployers();
        $this->command->info('✅ Created ' . count($employers) . ' employers');
        
        // Create gig workers
        $gigWorkers = $this->createGigWorkers();
        $this->command->info('✅ Created ' . count($gigWorkers) . ' gig workers');
        
        // Create jobs for employers
        $jobs = $this->createJobsForEmployers($employers);
        $this->command->info('✅ Created ' . count($jobs) . ' jobs');
        
        // Create some sample bids
        $this->createSampleBids($jobs, $gigWorkers);
        $this->command->info('✅ Created sample bids');
        
        $this->command->info('🎉 WorkWise seeding completed successfully!');
    }

    private function createEmployers(): array
    {
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
                'country' => 'Philippines', 'city' => '',
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
                'country' => 'Philippines', 'city' => '',
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
                'country' => 'Philippines', 'city' => '',
                'phone' => '+639191234567',
                'work_type_needed' => 'Data Entry, Customer Service, Virtual Assistance',
                'budget_range' => '₱15,000 - ₱50,000',
                'project_intent' => 'Operational support and customer service enhancement',
                'escrow_balance' => 100000.00, // ₱100,000.00
            ],
        ];

        $createdEmployers = [];
        foreach ($employers as $employerData) {
            $existing = User::where('email', $employerData['email'])->first();
            if (!$existing) {
                $createdEmployers[] = User::create($employerData);
            } else {
                $createdEmployers[] = $existing;
            }
        }

        return $createdEmployers;
    }

    private function createGigWorkers(): array
    {
        $gigWorkers = [
            [
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'email' => 'carlos.mendoza@developer.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Senior Full-Stack Developer',
                'bio' => 'Experienced full-stack developer with 5+ years building web applications for Filipino businesses.',
                'country' => 'Philippines', 'city' => '',
                'phone' => '+639171234568',
                'hourly_rate' => 800.00,
                ],
            [
                'first_name' => 'Michelle',
                'last_name' => 'Garcia',
                'email' => 'michelle.garcia@webdev.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Full-Stack Web Developer',
                'bio' => 'Passionate web developer with expertise in modern JavaScript frameworks and PHP.',
                'country' => 'Philippines', 'city' => '',
                'phone' => '+639181234568',
                'hourly_rate' => 650.00,
                ],
            [
                'first_name' => 'Mark',
                'last_name' => 'Villanueva',
                'email' => 'mark.villanueva@design.ph',
                'password' => Hash::make('password123'),
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'active',
                'professional_title' => 'Brand Identity & Graphic Designer',
                'bio' => 'Creative graphic designer with 4+ years of experience in brand identity and marketing materials.',
                'country' => 'Philippines', 'city' => '',
                'phone' => '+639211234568',
                'hourly_rate' => 450.00,
                ],
        ];

        $createdWorkers = [];
        foreach ($gigWorkers as $workerData) {
            $existing = User::where('email', $workerData['email'])->first();
            if (!$existing) {
                $createdWorkers[] = User::create($workerData);
            } else {
                $createdWorkers[] = $existing;
            }
        }

        return $createdWorkers;
    }

    private function createJobsForEmployers(array $employers): array
    {
        $jobTemplates = [
            [
                'title' => 'Full-Stack Web Developer for E-commerce Platform',
                'description' => 'We are looking for an experienced full-stack developer to build a comprehensive e-commerce platform for Filipino businesses.',
                'required_skills' => ['PHP', 'Laravel', 'JavaScript', 'Vue.js', 'MySQL'],
                'budget_type' => 'fixed',
                'budget_min' => 80000,
                'budget_max' => 120000,
                'estimated_duration_days' => 45,
                'is_remote' => true,
            'experience_level' => 'expert',
            ],
            [
                'title' => 'Brand Identity Design for Filipino Restaurant',
                'description' => 'Create a complete brand identity for a new Filipino restaurant chain.',
                'required_skills' => ['Graphic Design', 'Logo Design', 'Brand Identity', 'Adobe Creative Suite'],
                'budget_type' => 'fixed',
                'budget_min' => 35000,
                'budget_max' => 55000,
                'estimated_duration_days' => 25,
                'is_remote' => true,
            'experience_level' => 'expert',
            ],
            [
                'title' => 'Virtual Assistant - Customer Service',
                'description' => 'Hiring a reliable virtual assistant to handle customer inquiries and administrative support.',
                'required_skills' => ['Virtual Assistance', 'Customer Service', 'Email Management'],
                'budget_type' => 'hourly',
                'budget_min' => 200,
                'budget_max' => 350,
                'estimated_duration_days' => 90,
                'is_remote' => true,
            'experience_level' => 'expert',
            ],
        ];

        $createdJobs = [];
        foreach ($employers as $index => $employer) {
            if (isset($jobTemplates[$index])) {
                $jobData = $jobTemplates[$index];
                $jobData['employer_id'] = $employer->id;
                $jobData['status'] = 'open';
                $jobData['location'] = $employer->location;
                $jobData['deadline'] = now()->addDays($jobData['estimated_duration_days'] + 14);

                $existing = GigJob::where('employer_id', $employer->id)
                    ->where('title', $jobData['title'])
                    ->first();
                
                if (!$existing) {
                    $createdJobs[] = GigJob::create($jobData);
                } else {
                    $createdJobs[] = $existing;
                }
            }
        }

        return $createdJobs;
    }

    private function createSampleBids(array $jobs, array $gigWorkers): void
    {
        foreach ($jobs as $job) {
            // Create 1-2 bids per job
            $numBids = rand(1, 2);
            $selectedWorkers = collect($gigWorkers)->random($numBids);

            foreach ($selectedWorkers as $worker) {
                $existing = Bid::where('job_id', $job->id)
                    ->where('gig_worker_id', $worker->id)
                    ->first();

                if (!$existing) {
                    Bid::create([
                        'job_id' => $job->id,
                        'gig_worker_id' => $worker->id,
                        'bid_amount' => rand($job->budget_min, $job->budget_max),
                        'proposal_message' => "I am very interested in this project and believe I have the right skills to deliver excellent results. With my experience in " . implode(', ', array_slice($job->required_skills, 0, 3)) . ", I can help you achieve your goals within the specified timeline.",
                        'estimated_days' => rand(15, $job->estimated_duration_days),
                        'status' => 'pending',
                        'submitted_at' => now()->subDays(rand(1, 7)),
                    ]);
                }
            }
        }
    }
}


