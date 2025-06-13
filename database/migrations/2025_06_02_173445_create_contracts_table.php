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
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('freelancer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('job_id')->constrained('gig_jobs')->onDelete('cascade');
            $table->foreignId('bid_id')->constrained('bids')->onDelete('cascade');
            
            // Contract details
            $table->text('scope_of_work');
            $table->decimal('total_payment', 10, 2);
            $table->string('contract_type')->default('Fixed-Price Contract');
            $table->date('project_start_date');
            $table->date('project_end_date');
            
            // Client and freelancer responsibilities
            $table->json('client_responsibilities')->nullable();
            $table->json('freelancer_responsibilities')->nullable();
            
            // Communication preferences
            $table->string('preferred_communication')->default('Email and WorkWise messaging');
            $table->string('communication_frequency')->default('Weekly updates');
            
            // Contract status and signatures
            $table->enum('status', ['pending_freelancer_signature', 'pending_client_signature', 'fully_signed', 'cancelled'])->default('pending_client_signature');
            $table->timestamp('freelancer_signed_at')->nullable();
            $table->timestamp('client_signed_at')->nullable();
            $table->timestamp('fully_signed_at')->nullable();
            
            // PDF storage
            $table->string('pdf_path')->nullable();
            $table->timestamp('pdf_generated_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['status']);
            $table->index(['client_id']);
            $table->index(['freelancer_id']);
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
