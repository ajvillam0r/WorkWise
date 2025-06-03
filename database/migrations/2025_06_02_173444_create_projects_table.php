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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('gig_jobs')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('freelancer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('accepted_bid_id')->constrained('bids')->onDelete('cascade');
            $table->decimal('agreed_amount', 10, 2);
            $table->integer('agreed_duration_days');
            $table->enum('status', ['active', 'completed', 'cancelled', 'disputed']);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('deadline')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('completion_notes')->nullable();
            $table->json('milestones')->nullable(); // Track project milestones
            $table->boolean('payment_released')->default(false);
            $table->timestamps();

            $table->index(['client_id']);
            $table->index(['freelancer_id']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
