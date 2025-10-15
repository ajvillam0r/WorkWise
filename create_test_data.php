<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Project;
use App\Models\Review;
use App\Models\GigJob;
use App\Models\Bid;

echo "Creating test data for review system...\n";

// Get existing users
$employer = User::where('user_type', 'employer')->first();
$gigWorker = User::where('user_type', 'gig_worker')->first();

if (!$employer || !$gigWorker) {
    echo "No users found. Please run the seeder first.\n";
    exit(1);
}

echo "Found employer: {$employer->email}\n";
echo "Found gig worker: {$gigWorker->email}\n";

// Get an existing job
$job = GigJob::first();
if (!$job) {
    echo "No jobs found. Please run the seeder first.\n";
    exit(1);
}

echo "Found job: {$job->title}\n";

// Create a bid first (or use existing one)
$bid = Bid::where('job_id', $job->id)->where('gig_worker_id', $gigWorker->id)->first();
if (!$bid) {
    $bid = Bid::create([
        'job_id' => $job->id,
        'gig_worker_id' => $gigWorker->id,
        'bid_amount' => 1000,
        'proposal_message' => 'I can complete this project with high quality.',
        'estimated_days' => 7,
        'status' => 'accepted'
    ]);
    echo "Created bid ID: {$bid->id}\n";
} else {
    echo "Using existing bid ID: {$bid->id}\n";
}

// Create a test project
$project = Project::create([
    'employer_id' => $employer->id,
    'gig_worker_id' => $gigWorker->id,
    'job_id' => $job->id,
    'bid_id' => $bid->id,
    'agreed_amount' => 1000,
    'platform_fee' => 50, // 5% platform fee
    'net_amount' => 950,
    'status' => 'completed',
    'completed_at' => now(),
    'employer_approved' => true,
    'approved_at' => now()
]);

echo "Created project ID: {$project->id}\n";

// Create a test review
$review = Review::create([
    'project_id' => $project->id,
    'reviewer_id' => $employer->id,
    'reviewee_id' => $gigWorker->id,
    'reviewer_type' => 'employer',
    'reviewee_type' => 'gig_worker',
    'rating' => 5,
    'comment' => 'Excellent work! Very professional and delivered on time.',
    'is_public' => true,
    'is_visible' => true
]);

echo "Created review ID: {$review->id}\n";

// Create a counter review
$counterReview = Review::create([
    'project_id' => $project->id,
    'reviewer_id' => $gigWorker->id,
    'reviewee_id' => $employer->id,
    'reviewer_type' => 'gig_worker',
    'reviewee_type' => 'employer',
    'rating' => 4,
    'comment' => 'Good employer to work with. Clear requirements and prompt payment.',
    'is_public' => true,
    'is_visible' => true
]);

echo "Created counter review ID: {$counterReview->id}\n";

// Create a review with time-based visibility
$hiddenReview = Review::create([
    'project_id' => $project->id,
    'reviewer_id' => $employer->id,
    'reviewee_id' => $gigWorker->id,
    'reviewer_type' => 'employer',
    'reviewee_type' => 'gig_worker',
    'rating' => 3,
    'comment' => 'This review should be hidden until the deadline passes.',
    'is_public' => true,
    'is_visible' => false,
    'visibility_deadline' => now()->addMinutes(1) // Will be visible in 1 minute
]);

echo "Created hidden review ID: {$hiddenReview->id} (will be visible at: {$hiddenReview->visibility_deadline})\n";

echo "Test data created successfully!\n";