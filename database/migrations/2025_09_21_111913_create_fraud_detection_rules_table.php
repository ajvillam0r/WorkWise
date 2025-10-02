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
        Schema::create('fraud_detection_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_name');
            $table->text('description');
            $table->string('rule_type'); // threshold, pattern, behavioral, velocity
            $table->json('conditions'); // Rule conditions as JSON
            $table->json('parameters'); // Rule parameters
            $table->decimal('threshold_value', 10, 2)->nullable();
            $table->string('threshold_operator')->nullable(); // >, <, >=, <=, ==, !=
            $table->integer('time_window_minutes')->default(60); // Time window for the rule
            $table->decimal('risk_score', 5, 2); // Risk score when rule triggers
            $table->string('severity')->default('medium'); // low, medium, high, critical
            $table->boolean('enabled')->default(true);
            $table->integer('priority')->default(100); // Lower number = higher priority
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->json('tags')->nullable(); // Tags for categorization
            $table->timestamp('last_triggered_at')->nullable();
            $table->integer('trigger_count')->default(0);
            $table->timestamps();

            $table->index(['rule_type', 'enabled']);
            $table->index(['severity', 'enabled']);
            $table->index('priority');
            $table->unique(['rule_name', 'rule_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fraud_detection_rules');
    }
};
