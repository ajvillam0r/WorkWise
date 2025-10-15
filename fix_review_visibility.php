<?php

require_once 'vendor/autoload.php';

use App\Models\Review;
use Illuminate\Support\Facades\DB;

// Initialize Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Fixing review visibility...\n\n";

// Get all reviews
$reviews = Review::all();

foreach ($reviews as $review) {
    echo "Updating Review ID: {$review->id}\n";
    echo "Before - Visible: " . ($review->is_visible ? 'Yes' : 'No') . ", Mutual Completed: " . ($review->mutual_review_completed ? 'Yes' : 'No') . "\n";
    
    // Update to make reviews visible
    $review->update([
        'mutual_review_completed' => true,
        'made_public_at' => now()
    ]);
    
    echo "After - Visible: " . ($review->is_visible ? 'Yes' : 'No') . ", Mutual Completed: " . ($review->mutual_review_completed ? 'Yes' : 'No') . "\n";
    echo "---\n";
}

echo "\nFixed " . $reviews->count() . " reviews\n";