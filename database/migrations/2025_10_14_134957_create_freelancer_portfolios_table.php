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
        Schema::create('freelancer_portfolios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            
            $table->string('title');
            $table->text('description');
            $table->json('images')->nullable(); // Array of image paths
            $table->json('links')->nullable(); // Array of external links
            $table->json('technologies_used')->nullable(); // Array of technologies/skills
            $table->enum('project_type', ['web', 'mobile', 'design', 'writing', 'marketing', 'other'])->nullable();
            $table->date('completion_date')->nullable();
            $table->string('client_name')->nullable();
            $table->text('client_feedback')->nullable();
            $table->decimal('project_value', 10, 2)->nullable();
            $table->integer('duration_days')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_public')->default(true);
            $table->integer('display_order')->default(0);
            $table->integer('views_count')->default(0);
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['project_type']);
            $table->index(['is_featured']);
            $table->index(['is_public']);
            $table->index(['display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_portfolios');
    }
};
