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
        Schema::create('freelancer_experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            
            $table->string('company_name');
            $table->string('job_title');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->string('location')->nullable();
            $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'freelance', 'internship'])->nullable();
            $table->json('skills_used')->nullable();
            $table->text('achievements')->nullable();
            $table->integer('display_order')->default(0);
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['is_current']);
            $table->index(['display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_experiences');
    }
};
