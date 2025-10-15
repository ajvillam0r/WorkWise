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
        Schema::create('freelancer_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('employer_id')->constrained('users')->onDelete('cascade');
            
            $table->enum('earning_type', ['project', 'milestone', 'hourly', 'bonus', 'tip']);
            $table->decimal('amount', 10, 2);
            $table->decimal('platform_fee', 8, 2)->default(0);
            $table->decimal('net_amount', 10, 2); // Amount after platform fee
            
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded']);
            $table->text('description')->nullable();
            
            $table->timestamp('earned_at');
            $table->timestamp('paid_at')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('payment_method')->nullable();
            
            $table->json('metadata')->nullable(); // Additional earning details
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['project_id']);
            $table->index(['employer_id']);
            $table->index(['earning_type']);
            $table->index(['status']);
            $table->index(['earned_at']);
            $table->index(['paid_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_earnings');
    }
};
