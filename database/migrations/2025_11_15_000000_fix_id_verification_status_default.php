<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if we're using PostgreSQL
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'pgsql') {
            // PostgreSQL-specific approach
            // Step 1: Drop the default value
            DB::statement('ALTER TABLE users ALTER COLUMN id_verification_status DROP DEFAULT');
            
            // Step 2: Make the column nullable (if not already)
            DB::statement('ALTER TABLE users ALTER COLUMN id_verification_status DROP NOT NULL');
        } else {
            // MySQL/SQLite approach
            Schema::table('users', function (Blueprint $table) {
                $table->enum('id_verification_status', ['pending', 'verified', 'rejected'])
                    ->nullable()
                    ->default(null)
                    ->change();
            });
        }

        Log::info('ID_VERIFICATION_STATUS_COLUMN_UPDATED', [
            'event' => 'id_verification_status_column_updated',
            'action' => 'removed_default_pending',
            'driver' => $driver,
            'timestamp' => now()->toIso8601String(),
        ]);

        // Step 2: Correct existing users with 'pending' status but missing either or both images
        // This handles users who have pending status but don't have BOTH images uploaded
        $affectedUsers = DB::table('users')
            ->where('id_verification_status', 'pending')
            ->where(function ($query) {
                $query->whereNull('id_front_image')
                      ->orWhereNull('id_back_image');
            })
            ->update(['id_verification_status' => null]);

        Log::info('ID_VERIFICATION_STATUS_FIX_MIGRATION', [
            'event' => 'id_verification_status_fix_migration',
            'affected_users' => $affectedUsers,
            'action' => 'corrected_pending_to_null',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, set any null values to 'pending' to avoid constraint violations
        DB::table('users')
            ->whereNull('id_verification_status')
            ->update(['id_verification_status' => 'pending']);

        // Check if we're using PostgreSQL
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'pgsql') {
            // PostgreSQL-specific approach
            // Restore the default value to 'pending'
            DB::statement("ALTER TABLE users ALTER COLUMN id_verification_status SET DEFAULT 'pending'");
        } else {
            // MySQL/SQLite approach
            Schema::table('users', function (Blueprint $table) {
                $table->enum('id_verification_status', ['pending', 'verified', 'rejected'])
                    ->default('pending')
                    ->change();
            });
        }

        Log::info('ID_VERIFICATION_STATUS_ROLLBACK', [
            'event' => 'id_verification_status_rollback',
            'action' => 'restored_default_pending',
            'driver' => $driver,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
};
