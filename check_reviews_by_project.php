<?php

require_once 'vendor/autoload.php';

use App\Models\Review;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

// Initialize Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking reviews by project:\n\n";

// Get all reviews with their project associations
$reviews = Review::with(['project', 'reviewer', 'reviewee'])->get();

foreach ($reviews as $review) {
    echo "Review ID: {$review->id}\n";
    echo "Project ID: {$review->project_id}\n";
    echo "Reviewer: {$review->reviewer->name} (ID: {$review->reviewer_id})\n";
    echo "Reviewee: {$review->reviewee->name} (ID: {$review->reviewee_id})\n";
    echo "Rating: {$review->rating}\n";
    echo "Visible: " . ($review->is_visible ? 'Yes' : 'No') . "\n";
    echo "Created: {$review->created_at}\n";
    echo "---\n";
}

echo "\nTotal reviews: " . $reviews->count() . "\n";