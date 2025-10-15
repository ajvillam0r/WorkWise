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
        Schema::create('freelancers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Basic Profile Information
            $table->string('professional_title')->nullable();
            $table->text('bio')->nullable();
            $table->decimal('hourly_rate', 8, 2)->nullable();
            $table->enum('availability_status', ['available', 'busy', 'unavailable'])->default('available');
            
            // Media
            $table->string('profile_photo')->nullable();
            $table->string('cover_photo')->nullable();
            
            // Contact & Location
            $table->string('location')->nullable();
            $table->string('timezone')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('github_url')->nullable();
            $table->string('portfolio_url')->nullable();
            
            // Professional Details
            $table->integer('years_of_experience')->default(0);
            $table->integer('response_time_hours')->default(24);
            $table->integer('profile_completion_percentage')->default(0);
            
            // Privacy & Availability
            $table->boolean('is_profile_public')->default(true);
            $table->boolean('is_available_for_work')->default(true);
            
            // Preferences
            $table->enum('preferred_project_size', ['small', 'medium', 'large'])->nullable();
            $table->enum('preferred_project_duration', ['short', 'medium', 'long'])->nullable();
            $table->decimal('minimum_project_budget', 10, 2)->nullable();
            $table->json('languages_spoken')->nullable();
            
            // Counters (for performance)
            $table->integer('certifications_count')->default(0);
            $table->integer('portfolio_items_count')->default(0);
            
            // Financial Information
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->decimal('available_balance', 12, 2)->default(0);
            $table->decimal('pending_earnings', 12, 2)->default(0);
            
            // Performance Metrics
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->integer('total_projects_completed')->default(0);
            $table->decimal('success_rate', 5, 2)->default(0);
            $table->decimal('on_time_delivery_rate', 5, 2)->default(0);
            $table->decimal('repeat_client_rate', 5, 2)->default(0);
            
            // Activity Tracking
            $table->timestamp('last_active_at')->nullable();
            $table->integer('profile_views_count')->default(0);
            $table->integer('profile_views_this_month')->default(0);
            
            $table->softDeletes();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id']);
            $table->index(['availability_status']);
            $table->index(['is_profile_public']);
            $table->index(['is_available_for_work']);
            $table->index(['average_rating']);
            $table->index(['total_projects_completed']);
            $table->index(['last_active_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancers');
    }
};
