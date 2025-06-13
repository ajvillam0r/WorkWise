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
        Schema::table('projects', function (Blueprint $table) {
            // Check if columns don't exist before adding them (SQLite compatibility)
            if (!Schema::hasColumn('projects', 'contract_id')) {
                $table->foreignId('contract_id')->nullable()->constrained('contracts')->onDelete('set null');
                $table->index(['contract_id']);
            }
            if (!Schema::hasColumn('projects', 'contract_signed')) {
                $table->boolean('contract_signed')->default(false);
            }
            if (!Schema::hasColumn('projects', 'contract_signed_at')) {
                $table->timestamp('contract_signed_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Check if columns exist before dropping them (SQLite compatibility)
            if (Schema::hasColumn('projects', 'contract_id')) {
                // Drop index first if it exists
                try {
                    $table->dropIndex(['contract_id']);
                } catch (Exception $e) {
                    // Index might not exist, continue
                }

                // Drop foreign key constraint
                try {
                    $table->dropForeign(['contract_id']);
                } catch (Exception $e) {
                    // Foreign key might not exist, continue
                }

                // Drop the column
                $table->dropColumn('contract_id');
            }
            if (Schema::hasColumn('projects', 'contract_signed')) {
                $table->dropColumn('contract_signed');
            }
            if (Schema::hasColumn('projects', 'contract_signed_at')) {
                $table->dropColumn('contract_signed_at');
            }
        });
    }
};
