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
        // Step 1: Modify the column to make it nullable and remove default value
        Schema::table('users', function (Blueprint $table) {
            // Change the column to nullable with no default
            $table->enum('id_verification_status', ['pending', 'verified', 'rejected'])
                ->nullable()
                ->default(null)
                ->change();
        });

        Log::info('ID_VERIFICATION_STATUS_COLUMN_UPDATED', [
            'event' => 'id_verification_status_column_updated',
            'action' => 'removed_default_pending',
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

        // Restore the default value to 'pending'
        Schema::table('users', function (Blueprint $table) {
            $table->enum('id_verification_status', ['pending', 'verified', 'rejected'])
                ->default('pending')
                ->change();
        });

        Log::info('ID_VERIFICATION_STATUS_ROLLBACK', [
            'event' => 'id_verification_status_rollback',
            'action' => 'restored_default_pending',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
};
