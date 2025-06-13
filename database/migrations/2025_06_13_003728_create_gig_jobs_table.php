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
        Schema::create('gig_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->json('required_skills');
            $table->enum('budget_type', ['fixed', 'hourly']);
            $table->decimal('budget_min', 10, 2);
            $table->decimal('budget_max', 10, 2);
            $table->enum('experience_level', ['beginner', 'intermediate', 'expert']);
            $table->integer('estimated_duration_days');
            $table->enum('status', ['open', 'in_progress', 'closed', 'cancelled'])->default('open');
            $table->datetime('deadline')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_remote')->default(false);
            $table->timestamps();

            // Add indexes for better performance
            $table->index(['employer_id']);
            $table->index(['status']);
            $table->index(['experience_level']);
            $table->index(['budget_type']);
            $table->index(['is_remote']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gig_jobs');
    }
};
