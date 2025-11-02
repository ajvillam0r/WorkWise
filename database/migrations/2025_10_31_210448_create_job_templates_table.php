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
        Schema::create('job_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained('users')->onDelete('cascade');
            
            // Template metadata
            $table->string('template_name');
            $table->text('description')->nullable();
            $table->boolean('is_favorite')->default(false);
            
            // Job details (templates)
            $table->string('title_template');
            $table->text('description_template');
            $table->string('project_category')->nullable();
            
            // Skills
            $table->json('skills_requirements')->nullable();
            $table->json('nice_to_have_skills')->nullable();
            
            // Budget and timing
            $table->enum('budget_type', ['fixed', 'hourly'])->default('fixed');
            $table->decimal('typical_budget_min', 10, 2)->nullable();
            $table->decimal('typical_budget_max', 10, 2)->nullable();
            $table->enum('typical_duration', ['short_term', 'medium_term', 'long_term', 'ongoing'])->nullable();
            $table->integer('estimated_duration_days')->nullable();
            
            // Experience
            $table->enum('experience_level', ['beginner', 'intermediate', 'expert'])->nullable();
            $table->enum('job_complexity', ['simple', 'moderate', 'complex', 'expert'])->nullable();
            
            // Location
            $table->string('location')->nullable();
            $table->boolean('is_remote')->default(false);
            
            // Usage tracking
            $table->integer('times_used')->default(0);
            $table->timestamp('last_used_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('employer_id');
            $table->index('is_favorite');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_templates');
    }
};
