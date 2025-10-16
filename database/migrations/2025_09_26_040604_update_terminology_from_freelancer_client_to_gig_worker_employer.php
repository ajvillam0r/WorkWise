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
        // Step 1: Change user_type enum to string to allow new values (PostgreSQL doesn't easily allow enum modification)
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_type', 50)->default('gig_worker')->change();
        });

        // Step 2: Update data in users table
        DB::table('users')->where('user_type', 'freelancer')->update(['user_type' => 'gig_worker']);
        DB::table('users')->where('user_type', 'client')->update(['user_type' => 'employer']);

        // Note: The bids table already has gig_worker_id column, so no changes needed
        // Note: Projects and contracts tables already have the correct column names
        // (employer_id and gig_worker_id), so no changes needed there
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the changes

        // Step 1: Update data back in users table
        DB::table('users')->where('user_type', 'gig_worker')->update(['user_type' => 'freelancer']);
        DB::table('users')->where('user_type', 'employer')->update(['user_type' => 'client']);

        // Step 2: Change user_type back to enum
        Schema::table('users', function (Blueprint $table) {
            DB::statement("ALTER TABLE users ALTER COLUMN user_type TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'freelancer'");
        });
    }
};
