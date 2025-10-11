<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_behavior_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('session_id');
            $table->string('action_type'); // login, message, bid, payment, etc.
            $table->json('behavior_data'); // typing patterns, mouse movements, etc.
            $table->string('ip_address');
            $table->text('user_agent');
            $table->json('device_fingerprint');
            $table->decimal('risk_score', 3, 2)->default(0.00); // 0.00 to 1.00
            $table->json('risk_factors')->nullable();
            $table->boolean('flagged')->default(false);
            $table->timestamp('analyzed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'action_type']);
            $table->index(['risk_score', 'flagged']);
            $table->index('created_at');
        });

        Schema::create('security_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('alert_type'); // behavioral_anomaly, fraud_attempt, etc.
            $table->decimal('risk_score', 3, 2);
            $table->json('alert_data');
            $table->enum('status', ['pending', 'investigating', 'resolved', 'false_positive']);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->text('description');
            $table->json('recommended_actions');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['severity', 'status']);
        });

        Schema::create('user_typing_patterns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('avg_typing_speed'); // WPM
            $table->json('keystroke_dynamics'); // timing between keystrokes
            $table->json('pause_patterns'); // pause durations and frequencies
            $table->json('common_typos');
            $table->string('device_type'); // desktop, mobile, tablet
            $table->integer('sample_count')->default(1);
            $table->timestamp('last_updated')->useCurrent();
            $table->timestamps();

            $table->unique(['user_id', 'device_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_typing_patterns');
        Schema::dropIfExists('security_alerts');
        Schema::dropIfExists('user_behavior_analytics');
    }
};
