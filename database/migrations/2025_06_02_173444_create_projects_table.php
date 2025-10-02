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
            $table->foreignId('employer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('gig_worker_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('bid_id')->constrained('bids')->onDelete('cascade');
            $table->decimal('agreed_amount', 10, 2);
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2);
            $table->enum('status', ['active', 'completed', 'cancelled', 'disputed']);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->text('completion_notes')->nullable();
            $table->boolean('employer_approved')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->boolean('payment_released')->default(false);
            $table->timestamp('payment_released_at')->nullable();
            $table->timestamps();

            $table->index(['employer_id']);
            $table->index(['gig_worker_id']);
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
