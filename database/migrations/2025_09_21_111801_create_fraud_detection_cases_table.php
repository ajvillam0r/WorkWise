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
        Schema::create('fraud_detection_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_id')->unique(); // Human-readable case identifier
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('fraud_type'); // payment_fraud, identity_fraud, behavioral_anomaly, etc.
            $table->text('description');
            $table->json('evidence_data'); // Store evidence as JSON
            $table->decimal('fraud_score', 5, 2); // 0.00 to 100.00
            $table->decimal('financial_impact', 15, 2)->default(0); // Potential financial loss
            $table->string('status')->default('investigating'); // investigating, confirmed, false_positive, resolved
            $table->string('severity')->default('medium'); // low, medium, high, critical
            $table->foreignId('assigned_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('investigation_notes')->nullable(); // Admin investigation notes
            $table->timestamp('detected_at');
            $table->timestamp('resolved_at')->nullable();
            $table->json('resolution_data')->nullable(); // Resolution details
            $table->string('ip_address')->nullable();
            $table->json('user_agent')->nullable();
            $table->json('device_fingerprint')->nullable();
            $table->json('location_data')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['fraud_type', 'status']);
            $table->index(['severity', 'status']);
            $table->index('detected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fraud_detection_cases');
    }
};
