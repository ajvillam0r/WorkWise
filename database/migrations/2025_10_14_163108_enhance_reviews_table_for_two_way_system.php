<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            // Add fields for two-way review system
            $table->string('review_title')->nullable()->after('rating');
            $table->enum('reviewer_type', ['employer', 'gig_worker'])->after('reviewee_id');
            $table->enum('reviewee_type', ['employer', 'gig_worker'])->after('reviewer_type');
            
            // Visibility and mutual review logic
            $table->boolean('is_visible')->default(false)->after('is_public');
            $table->timestamp('visibility_deadline')->nullable()->after('is_visible');
            $table->boolean('mutual_review_completed')->default(false)->after('visibility_deadline');
            $table->timestamp('made_public_at')->nullable()->after('mutual_review_completed');
            
            // Reply system for gig workers
            $table->text('gig_worker_reply')->nullable()->after('made_public_at');
            $table->timestamp('replied_at')->nullable()->after('gig_worker_reply');
            
            // Additional metadata
            $table->json('review_metadata')->nullable()->after('replied_at');
            $table->boolean('is_featured')->default(false)->after('review_metadata');
            $table->integer('helpfulness_score')->default(0)->after('is_featured');
            
            // Add indexes for performance
            $table->index(['is_visible', 'made_public_at']);
            $table->index(['reviewer_type', 'reviewee_type']);
            $table->index(['mutual_review_completed']);
            $table->index(['visibility_deadline']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['is_visible', 'made_public_at']);
            $table->dropIndex(['reviewer_type', 'reviewee_type']);
            $table->dropIndex(['mutual_review_completed']);
            $table->dropIndex(['visibility_deadline']);
            
            $table->dropColumn([
                'review_title',
                'reviewer_type',
                'reviewee_type',
                'is_visible',
                'visibility_deadline',
                'mutual_review_completed',
                'made_public_at',
                'gig_worker_reply',
                'replied_at',
                'review_metadata',
                'is_featured',
                'helpfulness_score'
            ]);
        });
    }
};
