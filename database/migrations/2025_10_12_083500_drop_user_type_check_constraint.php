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
        // Drop the old enum check constraints to allow flexibility
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check");
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_profile_status_check");
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_experience_level_check");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't recreate the constraint on rollback since we want flexibility
    }
};
