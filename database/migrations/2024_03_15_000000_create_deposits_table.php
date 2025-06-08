<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('usd');
            $table->string('stripe_payment_intent_id')->unique();
            $table->string('payment_method')->nullable();
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('stripe_payment_intent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
}; 