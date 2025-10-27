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
        Schema::create('portfolio_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('project_url')->nullable();
            $table->json('images')->nullable(); // Array of image URLs
            $table->json('tags')->nullable(); // Skills/technologies used
            $table->date('completion_date')->nullable();
            $table->enum('project_type', ['web', 'mobile', 'design', 'writing', 'other'])->default('other');
            $table->integer('display_order')->default(0);
            $table->timestamps();
            
            $table->index(['user_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_items');
    }
};
