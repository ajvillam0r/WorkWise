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
        Schema::create('fraud_detection_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('alert_id')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('alert_type'); // rule_triggered, manual_flag, system_detected
            $table->string('rule_name')->nullable(); // If triggered by a rule
            $table->foreignId('fraud_case_id')->nullable()->constrained('fraud_detection_cases')->onDelete('set null');
            $table->text('alert_message');
            $table->json('alert_data'); // Detailed alert information
            $table->decimal('risk_score', 5, 2);
            $table->string('severity')->default('medium'); // low, medium, high, critical
            $table->string('status')->default('active'); // active, acknowledged, resolved, false_positive
            $table->foreignId('assigned_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('triggered_at');
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->json('resolution_notes')->nullable();
            $table->boolean('notified')->default(false); // Whether admin was notified
            $table->json('notification_channels')->nullable(); // email, sms, dashboard, etc.
            $table->string('ip_address')->nullable();
            $table->json('user_agent')->nullable();
            $table->json('context_data')->nullable(); // Additional context
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['alert_type', 'status']);
            $table->index(['severity', 'status']);
            $table->index('triggered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fraud_detection_alerts');
    }
};
