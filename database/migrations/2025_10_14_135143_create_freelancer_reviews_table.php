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
        Schema::create('freelancer_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            $table->foreignId('employer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            
            $table->decimal('rating', 3, 2); // Overall rating (1.00 to 5.00)
            $table->decimal('communication_rating', 3, 2)->nullable();
            $table->decimal('quality_rating', 3, 2)->nullable();
            $table->decimal('timeliness_rating', 3, 2)->nullable();
            $table->decimal('professionalism_rating', 3, 2)->nullable();
            
            $table->text('review_text');
            $table->text('private_feedback')->nullable(); // Feedback only visible to freelancer
            $table->json('skills_rated')->nullable(); // Skills that were specifically rated
            
            $table->boolean('is_public')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_verified')->default(false); // Verified as legitimate project
            
            $table->text('freelancer_response')->nullable();
            $table->timestamp('freelancer_response_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['employer_id']);
            $table->index(['project_id']);
            $table->index(['rating']);
            $table->index(['is_public']);
            $table->index(['is_featured']);
            $table->index(['is_verified']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_reviews');
    }
};
