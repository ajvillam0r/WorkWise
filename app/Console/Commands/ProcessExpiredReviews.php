<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Review;
use Carbon\Carbon;

class ProcessExpiredReviews extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reviews:process-expired {--dry-run : Show what would be processed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process expired reviews and make them publicly visible according to visibility rules';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        $this->info('Processing expired reviews...');
        
        // Find reviews that have passed their visibility deadline
        $expiredReviews = Review::where('is_visible', false)
            ->whereNotNull('visibility_deadline')
            ->where('visibility_deadline', '<=', Carbon::now())
            ->with(['project', 'reviewer', 'reviewee'])
            ->get();

        if ($expiredReviews->isEmpty()) {
            $this->info('No expired reviews found.');
            return 0;
        }

        $this->info("Found {$expiredReviews->count()} expired reviews to process.");

        $processedCount = 0;
        $errorCount = 0;

        foreach ($expiredReviews as $review) {
            try {
                if ($dryRun) {
                    $this->line("Would make review #{$review->id} visible (Project: {$review->project->title})");
                } else {
                    // Make the review visible
                    $review->update([
                        'is_visible' => true,
                        'made_public_at' => Carbon::now(),
                    ]);

                    // Check if there's a counterpart review for this project
                    $counterpartReview = Review::where('project_id', $review->project_id)
                        ->where('reviewer_id', $review->reviewee_id)
                        ->where('reviewee_id', $review->reviewer_id)
                        ->first();

                    // If both reviews exist and are now visible, mark mutual review as completed
                    if ($counterpartReview && $counterpartReview->is_visible) {
                        $review->update(['mutual_review_completed' => true]);
                        $counterpartReview->update(['mutual_review_completed' => true]);
                        
                        $this->line("✓ Review #{$review->id} made visible and marked as mutual review");
                    } else {
                        $this->line("✓ Review #{$review->id} made visible (single review)");
                    }
                }
                
                $processedCount++;
            } catch (\Exception $e) {
                $this->error("✗ Failed to process review #{$review->id}: {$e->getMessage()}");
                $errorCount++;
            }
        }

        if ($dryRun) {
            $this->info("Dry run completed. {$processedCount} reviews would be processed.");
        } else {
            $this->info("Processing completed:");
            $this->info("- Successfully processed: {$processedCount} reviews");
            if ($errorCount > 0) {
                $this->warn("- Errors encountered: {$errorCount} reviews");
            }
        }

        return $errorCount > 0 ? 1 : 0;
    }
}
