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
        Schema::create('freelancer_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            $table->foreignId('skill_id')->constrained()->onDelete('cascade');
            
            $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert']);
            $table->integer('years_of_experience')->default(0);
            $table->text('description')->nullable(); // How they use this skill
            $table->boolean('is_featured')->default(false); // Top skills to highlight
            $table->decimal('hourly_rate', 8, 2)->nullable(); // Skill-specific rate
            $table->integer('projects_completed')->default(0);
            $table->decimal('average_rating', 3, 2)->nullable();
            $table->date('last_used')->nullable();
            $table->integer('display_order')->default(0);
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['skill_id']);
            $table->index(['proficiency_level']);
            $table->index(['is_featured']);
            $table->index(['display_order']);
            $table->unique(['freelancer_id', 'skill_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_skills');
    }
};
