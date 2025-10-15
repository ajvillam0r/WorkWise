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
        Schema::create('freelancer_languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            
            $table->string('language');
            $table->enum('proficiency_level', ['basic', 'conversational', 'fluent', 'native']);
            $table->boolean('is_native')->default(false);
            $table->text('certifications')->nullable(); // Language certifications if any
            $table->integer('display_order')->default(0);
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['proficiency_level']);
            $table->index(['is_native']);
            $table->index(['display_order']);
            $table->unique(['freelancer_id', 'language']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_languages');
    }
};
