<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\GigJob;
use App\Models\Project;
use App\Models\Bid;
use App\Models\Transaction;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TransactionReportTestSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Creating test users and transactions for report testing...');

        // Create test employers
        $employers = $this->createTestEmployers();
        $this->command->info("Created " . count($employers) . " test employers");

        // Create test gig workers
        $gigWorkers = $this->createTestGigWorkers();
        $this->command->info("Created " . count($gigWorkers) . " test gig workers");

        // Create jobs and projects
        $projects = $this->createJobsAndProjects($employers, $gigWorkers);
        $this->command->info("Created " . count($projects) . " test projects");

        // Create various types of transactions
        $transactions = $this->createTestTransactions($projects);
        $this->command->info("Created " . count($transactions) . " test transactions");

        $this->command->info('Test data creation completed!');
        $this->command->info('');
        $this->command->info('Test Accounts:');
        $this->command->info('Admin: admin@workwise.com / password');
        $this->command->info('Employer 1: employer1@test.com / password');
        $this->command->info('Employer 2: employer2@test.com / password');
        $this->command->info('Gig Worker 1: worker1@test.com / password');
        $this->command->info('Gig Worker 2: worker2@test.com / password');
        $this->command->info('');
        $this->command->info('You can now test transaction reports at: /reports/transactions');
    }

    private function createTestEmployers()
    {
        // Check if test employers already exist
        $existingEmployer = User::where('email', 'employer1@test.com')->first();
        if ($existingEmployer) {
            return User::whereIn('email', ['employer1@test.com', 'employer2@test.com'])->get();
        }

        $employers = [
            [
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'email' => 'employer1@test.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'barangay' => 'Lapu-Lapu City',
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'approved',
                'company_name' => 'Tech Solutions Inc.',
                'work_type_needed' => 'Web Development',
                'budget_range' => '₱10,000 - ₱50,000',
                'project_intent' => 'Building modern web applications',
                'bio' => 'Tech company looking for skilled developers for various projects.'
            ],
            [
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'email' => 'employer2@test.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'barangay' => 'Lapu-Lapu City',
                'user_type' => 'employer',
                'profile_completed' => true,
                'profile_status' => 'approved',
                'company_name' => 'Digital Marketing Pro',
                'work_type_needed' => 'Digital Marketing',
                'budget_range' => '₱5,000 - ₱25,000',
                'project_intent' => 'Need marketing materials and website updates',
                'bio' => 'Marketing agency specializing in digital campaigns.'
            ]
        ];

        $createdEmployers = [];
        foreach ($employers as $employerData) {
            $employer = User::create($employerData);
            $createdEmployers[] = $employer;
        }

        return $createdEmployers;
    }

    private function createTestGigWorkers()
    {
        // Check if test gig workers already exist
        $existingWorker = User::where('email', 'worker1@test.com')->first();
        if ($existingWorker) {
            return User::whereIn('email', ['worker1@test.com', 'worker2@test.com'])->get();
        }

        $gigWorkers = [
            [
                'first_name' => 'Carlos',
                'last_name' => 'Rodriguez',
                'email' => 'worker1@test.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'barangay' => 'Lapu-Lapu City',
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'approved',
                'professional_title' => 'Full Stack Developer',
                'hourly_rate' => 75.00,
                'experience_level' => 'expert',
                'skills' => ['PHP', 'Laravel', 'React', 'Vue.js', 'MySQL', 'JavaScript'],
                'languages' => ['English', 'Filipino', 'Cebuano'],
                'bio' => 'Experienced full stack developer with 8+ years in web development.',
                'portfolio_url' => 'https://portfolio.example.com'
            ],
            [
                'first_name' => 'Ana',
                'last_name' => 'Garcia',
                'email' => 'worker2@test.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'barangay' => 'Lapu-Lapu City',
                'user_type' => 'gig_worker',
                'profile_completed' => true,
                'profile_status' => 'approved',
                'professional_title' => 'UI/UX Designer',
                'hourly_rate' => 60.00,
                'experience_level' => 'intermediate',
                'skills' => ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
                'languages' => ['English', 'Filipino'],
                'bio' => 'Creative designer focused on user-centered design solutions.',
                'portfolio_url' => 'https://design.example.com'
            ]
        ];

        $createdGigWorkers = [];
        foreach ($gigWorkers as $workerData) {
            $gigWorker = User::create($workerData);
            $createdGigWorkers[] = $gigWorker;
        }

        return $createdGigWorkers;
    }

    private function createJobsAndProjects($employers, $gigWorkers)
    {
        $projects = [];
        $jobTemplates = [
            [
                'title' => 'E-commerce Website Development',
                'description' => 'Build a modern e-commerce platform with payment integration, inventory management, and admin dashboard.',
                'required_skills' => ['PHP', 'Laravel', 'React', 'MySQL'],
                'budget_min' => 25000,
                'budget_max' => 45000,
                'experience_level' => 'expert'
            ],
            [
                'title' => 'Mobile App UI/UX Design',
                'description' => 'Design user interface and user experience for a mobile application targeting local tourism.',
                'required_skills' => ['Figma', 'Prototyping', 'User Research'],
                'budget_min' => 15000,
                'budget_max' => 25000,
                'experience_level' => 'intermediate'
            ],
            [
                'title' => 'API Integration Project',
                'description' => 'Integrate third-party APIs for payment processing, SMS notifications, and data synchronization.',
                'required_skills' => ['PHP', 'Laravel', 'REST APIs', 'JavaScript'],
                'budget_min' => 18000,
                'budget_max' => 30000,
                'experience_level' => 'intermediate'
            ]
        ];

        foreach ($jobTemplates as $index => $jobTemplate) {
            $employer = $employers[$index % count($employers)];
            $gigWorker = $gigWorkers[$index % count($gigWorkers)];

            // Create job
            $job = GigJob::create([
                'employer_id' => $employer->id,
                'title' => $jobTemplate['title'],
                'description' => $jobTemplate['description'],
                'required_skills' => $jobTemplate['required_skills'],
                'budget_type' => 'fixed',
                'budget_min' => $jobTemplate['budget_min'],
                'budget_max' => $jobTemplate['budget_max'],
                'experience_level' => $jobTemplate['experience_level'],
                'estimated_duration_days' => rand(15, 45),
                'status' => 'closed',
                'is_remote' => true
            ]);

            // Create bid
            $bidAmount = rand($jobTemplate['budget_min'], $jobTemplate['budget_max']);
            $bid = Bid::create([
                'job_id' => $job->id,
                'gig_worker_id' => $gigWorker->id,
                'bid_amount' => $bidAmount,
                'proposal_message' => 'I am very interested in this project and confident I can deliver excellent results.',
                'estimated_days' => rand(15, 45),
                'status' => 'accepted'
            ]);

            // Calculate fees
            $platformFee = $bidAmount * 0.05; // 5% platform fee
            $netAmount = $bidAmount - $platformFee;

            // Create project
            $project = Project::create([
                'job_id' => $job->id,
                'employer_id' => $employer->id,
                'gig_worker_id' => $gigWorker->id,
                'bid_id' => $bid->id,
                'agreed_amount' => $bidAmount,
                'platform_fee' => $platformFee,
                'net_amount' => $netAmount,
                'status' => 'completed',
                'started_at' => Carbon::now()->subDays(rand(30, 90)),
                'completed_at' => Carbon::now()->subDays(rand(1, 29)),
                'payment_released' => true
            ]);

            $projects[] = $project;
        }

        return $projects;
    }

    private function createTestTransactions($projects)
    {
        $transactions = [];
        $transactionTypes = ['escrow', 'release', 'refund', 'fee'];
        $transactionStatuses = ['completed', 'pending', 'failed'];

        foreach ($projects as $project) {
            // Create escrow transaction (employer pays platform)
            $escrowTransaction = Transaction::create([
                'project_id' => $project->id,
                'payer_id' => $project->employer_id,
                'payee_id' => $project->gig_worker_id,
                'amount' => $project->agreed_amount,
                'platform_fee' => $project->platform_fee,
                'net_amount' => $project->net_amount,
                'type' => 'escrow',
                'status' => 'completed',
                'stripe_payment_intent_id' => 'pi_escrow_' . $project->id . '_' . time(),
                'stripe_charge_id' => 'ch_escrow_' . $project->id . '_' . time(),
                'description' => 'Escrow payment for project: ' . $project->job->title,
                'processed_at' => Carbon::now()->subDays(rand(30, 60))
            ]);
            $transactions[] = $escrowTransaction;

            // Create release transaction (platform releases to gig worker)
            $releaseTransaction = Transaction::create([
                'project_id' => $project->id,
                'payer_id' => $project->employer_id,
                'payee_id' => $project->gig_worker_id,
                'amount' => $project->net_amount,
                'platform_fee' => 0,
                'net_amount' => $project->net_amount,
                'type' => 'release',
                'status' => 'completed',
                'stripe_payment_intent_id' => 'pi_release_' . $project->id . '_' . time(),
                'description' => 'Payment release for completed project: ' . $project->job->title,
                'processed_at' => Carbon::now()->subDays(rand(1, 29))
            ]);
            $transactions[] = $releaseTransaction;

            // Create some additional transactions for variety
            if (rand(1, 100) <= 70) { // 70% chance of additional transactions
                $additionalType = $transactionTypes[array_rand($transactionTypes)];
                $additionalStatus = $transactionStatuses[array_rand($transactionStatuses)];

                $additionalAmount = rand(500, 5000);
                $additionalFee = $additionalType === 'escrow' ? $additionalAmount * 0.05 : 0;

                $additionalTransaction = Transaction::create([
                    'project_id' => $project->id,
                    'payer_id' => rand(0, 1) ? $project->employer_id : $project->gig_worker_id,
                    'payee_id' => rand(0, 1) ? $project->employer_id : $project->gig_worker_id,
                    'amount' => $additionalAmount,
                    'platform_fee' => $additionalFee,
                    'net_amount' => $additionalAmount - $additionalFee,
                    'type' => $additionalType,
                    'status' => $additionalStatus,
                    'stripe_payment_intent_id' => 'pi_' . $additionalType . '_' . $project->id . '_' . time(),
                    'description' => ucfirst($additionalType) . ' transaction for project: ' . $project->job->title,
                    'processed_at' => Carbon::now()->subDays(rand(1, 90))
                ]);
                $transactions[] = $additionalTransaction;
            }
        }

        // Create additional transactions for existing projects to add variety
        foreach ($projects as $project) {
            // Add a fee transaction for some projects
            if (rand(1, 100) <= 50) { // 50% chance
                $feeTransaction = Transaction::create([
                    'project_id' => $project->id,
                    'payer_id' => $project->employer_id,
                    'payee_id' => $project->gig_worker_id,
                    'amount' => rand(100, 500),
                    'platform_fee' => 0,
                    'net_amount' => rand(100, 500),
                    'type' => 'fee',
                    'status' => 'completed',
                    'stripe_payment_intent_id' => 'pi_fee_' . $project->id . '_' . time(),
                    'description' => 'Additional fee for project modifications',
                    'processed_at' => Carbon::now()->subDays(rand(1, 15))
                ]);
                $transactions[] = $feeTransaction;
            }
        }

        return $transactions;
    }
}