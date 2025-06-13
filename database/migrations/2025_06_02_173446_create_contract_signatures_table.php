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
        Schema::create('contract_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('full_name');
            $table->enum('role', ['client', 'freelancer']);
            
            // Signature metadata for legal defensibility
            $table->string('ip_address');
            $table->text('user_agent')->nullable();
            $table->timestamp('signed_at');
            $table->string('contract_version_hash')->nullable(); // Hash of contract terms at time of signing
            
            // Additional metadata
            $table->json('browser_info')->nullable();
            $table->string('device_type')->nullable();
            
            $table->timestamps();
            
            $table->index(['contract_id', 'role']);
            $table->index(['user_id']);
            $table->unique(['contract_id', 'user_id']); // One signature per user per contract
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_signatures');
    }
};
