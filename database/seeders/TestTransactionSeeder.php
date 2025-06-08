<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\GigJob;
use App\Models\Project;
use App\Models\Bid;
use Illuminate\Support\Str;

class TestTransactionSeeder extends Seeder
{
    public function run()
    {
        // Create client
        $client = User::create([
            'first_name' => 'Test',
            'last_name' => 'Client',
            'email' => 'test.client@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
            'stripe_customer_id' => 'cus_test123',
            'barangay' => 'Test Barangay',
            'user_type' => 'client',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'company_name' => 'Test Company',
            'work_type_needed' => 'Web Development',
            'budget_range' => '₱5,000 - ₱10,000',
            'project_intent' => 'Looking for skilled developers'
        ]);

        // Create freelancer
        $freelancer = User::create([
            'first_name' => 'Test',
            'last_name' => 'Freelancer',
            'email' => 'test.freelancer@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
            'stripe_account_id' => 'acct_test123',
            'barangay' => 'Test Barangay',
            'user_type' => 'freelancer',
            'profile_completed' => true,
            'profile_status' => 'approved',
            'professional_title' => 'Full Stack Developer',
            'hourly_rate' => 50.00,
            'skills' => ['PHP', 'Laravel', 'React'],
            'languages' => ['English', 'Filipino']
        ]);

        // Create job
        $job = GigJob::create([
            'employer_id' => $client->id,
            'title' => 'Test Project',
            'description' => 'This is a test project for transaction testing',
            'required_skills' => ['PHP', 'Laravel'],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 30,
            'status' => 'open',
            'is_remote' => true
        ]);

        // Create bid
        $bid = Bid::create([
            'job_id' => $job->id,
            'freelancer_id' => $freelancer->id,
            'bid_amount' => 1500,
            'proposal_message' => 'I am interested in working on this project',
            'estimated_days' => 25,
            'status' => 'accepted'
        ]);

        // Calculate platform fee and net amount
        $platformFee = $bid->bid_amount * 0.05; // 5% platform fee
        $netAmount = $bid->bid_amount - $platformFee;

        // Create project
        $project = Project::create([
            'job_id' => $job->id,
            'client_id' => $client->id,
            'freelancer_id' => $freelancer->id,
            'bid_id' => $bid->id,
            'agreed_amount' => $bid->bid_amount,
            'platform_fee' => $platformFee,
            'net_amount' => $netAmount,
            'status' => 'active',
            'started_at' => now(),
            'payment_released' => false
        ]);

        echo "Test data created successfully!\n";
        echo "Project ID: {$project->id}\n";
        echo "Client Email: {$client->email}\n";
        echo "Freelancer Email: {$freelancer->email}\n";
        echo "Password for both accounts: password\n";
    }
} 