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
        // SQLite doesn't have named constraints like PostgreSQL
        // The constraints were already handled by the previous migration
        // This migration is essentially a no-op for SQLite
        // Just log that we're skipping constraint drops for SQLite
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check");
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_profile_status_check");
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_experience_level_check");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't recreate the constraint on rollback since we want flexibility
    }
};
