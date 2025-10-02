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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('contract_id')->unique(); // e.g., WW-2025-001234
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('employer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('gig_worker_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('job_id')->constrained('gig_jobs')->onDelete('cascade');
            $table->foreignId('bid_id')->constrained('bids')->onDelete('cascade');
            
            // Contract details
            $table->text('scope_of_work');
            $table->decimal('total_payment', 10, 2);
            $table->string('contract_type')->default('Fixed-Price Contract');
            $table->date('project_start_date');
            $table->date('project_end_date');
            
            // Employer and gig worker responsibilities
            $table->json('employer_responsibilities')->nullable();
            $table->json('gig_worker_responsibilities')->nullable();
            
            // Communication preferences
            $table->string('preferred_communication')->default('Email and WorkWise messaging');
            $table->string('communication_frequency')->default('Weekly updates');
            
            // Contract status and signatures
            $table->enum('status', ['pending_gig_worker_signature', 'pending_employer_signature', 'fully_signed', 'cancelled'])->default('pending_employer_signature');
            $table->timestamp('gig_worker_signed_at')->nullable();
            $table->timestamp('employer_signed_at')->nullable();
            $table->timestamp('fully_signed_at')->nullable();
            
            // PDF storage
            $table->string('pdf_path')->nullable();
            $table->timestamp('pdf_generated_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['status']);
            $table->index(['employer_id']);
            $table->index(['gig_worker_id']);
            $table->index(['project_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
