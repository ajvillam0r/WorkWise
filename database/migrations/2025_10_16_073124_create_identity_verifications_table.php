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
        Schema::create('identity_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('stripe_verification_session_id')->unique();
            $table->enum('status', ['requires_input', 'requires_action', 'processing', 'verified', 'canceled'])->default('requires_input');
            $table->enum('verification_type', ['document', 'id_number'])->default('document');
            $table->json('verification_data')->nullable(); // Store Stripe verification session data
            $table->json('document_data')->nullable(); // Store document verification results
            $table->json('selfie_data')->nullable(); // Store selfie verification results
            $table->boolean('liveness_check_passed')->nullable();
            $table->json('fraud_detection_results')->nullable();
            $table->string('client_secret')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index('stripe_verification_session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('identity_verifications');
    }
};
