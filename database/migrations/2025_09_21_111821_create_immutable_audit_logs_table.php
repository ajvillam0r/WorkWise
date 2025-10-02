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
        Schema::create('immutable_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('log_id')->unique(); // Unique log identifier
            $table->string('table_name'); // Table being audited
            $table->string('action'); // CREATE, UPDATE, DELETE
            $table->unsignedBigInteger('record_id'); // ID of the record being audited
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // User who performed the action
            $table->string('user_type')->default('system'); // user, admin, system
            $table->json('old_values')->nullable(); // Previous values (for updates/deletes)
            $table->json('new_values')->nullable(); // New values (for creates/updates)
            $table->json('metadata')->nullable(); // Additional context (IP, user agent, etc.)
            $table->string('ip_address')->nullable();
            $table->json('user_agent')->nullable();
            $table->string('session_id')->nullable();
            $table->string('hash_signature'); // Cryptographic hash of the log entry
            $table->string('previous_hash')->nullable(); // Hash of previous log entry (blockchain-like)
            $table->timestamp('logged_at');
            $table->timestamps();

            $table->index(['table_name', 'record_id']);
            $table->index(['user_id', 'logged_at']);
            $table->index(['action', 'logged_at']);
            $table->index('logged_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('immutable_audit_logs');
    }
};
