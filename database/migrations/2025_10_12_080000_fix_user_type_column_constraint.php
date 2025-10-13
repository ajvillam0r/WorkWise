<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change user_type from enum to string to allow gig_worker and employer values
        // This fixes the registration 500 error
        // SQLite doesn't support ALTER COLUMN TYPE, so we use Laravel's schema builder
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_type', 50)->default('gig_worker')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Reverting to enum would require recreating the enum type
        // For now, we'll just keep it as varchar even on rollback
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_type', 50)->default('freelancer')->change();
        });
    }
};
