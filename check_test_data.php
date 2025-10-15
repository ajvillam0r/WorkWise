<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Project;
use App\Models\Review;

echo "Projects: " . Project::count() . PHP_EOL;
echo "Reviews: " . Review::count() . PHP_EOL;

$reviews = Review::with(['reviewer', 'reviewee', 'project'])->get();
foreach($reviews as $review) {
    echo "Review ID: {$review->id}, Rating: {$review->rating}, Visible: " . ($review->is_visible ? 'Yes' : 'No') . ", From: {$review->reviewer->name} To: {$review->reviewee->name}" . PHP_EOL;
}

$projects = Project::with(['employer', 'gigWorker'])->get();
foreach($projects as $project) {
    echo "Project ID: {$project->id}, Status: {$project->status}, Employer: {$project->employer->name}, Worker: {$project->gigWorker->name}" . PHP_EOL;
}