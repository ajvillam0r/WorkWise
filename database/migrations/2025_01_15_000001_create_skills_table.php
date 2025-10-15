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
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('usage_count')->default(0); // Track how many freelancers have this skill
            $table->timestamps();
            
            $table->index(['name']);
            $table->index(['slug']);
            $table->index(['category']);
            $table->index(['is_active']);
            $table->index(['usage_count']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};