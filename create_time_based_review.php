<?php

require_once 'vendor/autoload.php';

use App\Models\Review;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;

// Initialize Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Creating time-based review test...\n\n";

// Get a project and users for testing
$project = Project::first();
$employer = User::find($project->employer_id);
$gigWorker = User::find($project->gig_worker_id);

// Create a review with expired visibility deadline (1 day ago)
$expiredDeadline = Carbon::now()->subDays(1);

$review = Review::create([
    'project_id' => $project->id,
    'reviewer_id' => $employer->id,
    'reviewee_id' => $gigWorker->id,
    'rating' => 3,
    'comment' => 'This is a test review for time-based visibility.',
    'review_title' => 'Time-based Test Review',
    'reviewer_type' => 'employer',
    'reviewee_type' => 'gig_worker',
    'visibility_deadline' => $expiredDeadline,
    'is_public' => true,
    'is_visible' => false,
    'mutual_review_completed' => false,
    'made_public_at' => null,
]);

echo "Created review with expired deadline:\n";
echo "Review ID: {$review->id}\n";
echo "Visibility Deadline: {$review->visibility_deadline}\n";
echo "Is Visible: " . ($review->is_visible ? 'Yes' : 'No') . "\n";
echo "Mutual Review Completed: " . ($review->mutual_review_completed ? 'Yes' : 'No') . "\n";
echo "Made Public At: " . ($review->made_public_at ? $review->made_public_at : 'Not set') . "\n";
echo "\nThis review should be processed by the ProcessExpiredReviews command.\n";