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
        DB::statement("ALTER TABLE users ALTER COLUMN user_type TYPE VARCHAR(50)");
        DB::statement("ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'gig_worker'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Reverting to enum would require recreating the enum type
        // For now, we'll just keep it as varchar even on rollback
        DB::statement("ALTER TABLE users ALTER COLUMN user_type TYPE VARCHAR(50)");
    }
};
