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
        // User analytics indexes
        $this->createIndexIfNotExists('users', 'user_type');
        $this->createIndexIfNotExists('users', 'email_verified_at');
        $this->createIndexIfNotExists('users', 'id_verification_status');
        $this->createIndexIfNotExists('users', 'created_at');

        // GigJob analytics indexes
        $this->createIndexIfNotExists('gig_jobs', 'category');
        $this->createIndexIfNotExists('gig_jobs', 'match_quality');

        // Contract analytics indexes
        $this->createIndexIfNotExists('contracts', 'match_quality');

        // Transaction analytics indexes
        $this->createIndexIfNotExists('transactions', 'type');

        // Review analytics indexes
        $this->createIndexIfNotExists('reviews', 'rating');

        // Report/Dispute analytics indexes
        $this->createIndexIfNotExists('reports', 'type');
    }

    /**
     * Create index if it doesn't exist
     */
    private function createIndexIfNotExists($table, $column): void
    {
        try {
            $indexName = "{$table}_{$column}_index";
            DB::statement("CREATE INDEX IF NOT EXISTS {$indexName} ON {$table}({$column})");
        } catch (\Exception $e) {
            // Index might already exist, silently continue
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For SQLite, we use DROP INDEX IF EXISTS
        $this->dropIndexIfExists('users_user_type_index');
        $this->dropIndexIfExists('users_email_verified_at_index');
        $this->dropIndexIfExists('users_id_verification_status_index');
        $this->dropIndexIfExists('users_created_at_index');
        $this->dropIndexIfExists('gig_jobs_category_index');
        $this->dropIndexIfExists('gig_jobs_match_quality_index');
        $this->dropIndexIfExists('contracts_match_quality_index');
        $this->dropIndexIfExists('transactions_type_index');
        $this->dropIndexIfExists('reviews_rating_index');
        $this->dropIndexIfExists('reports_type_index');
    }

    /**
     * Drop index if it exists
     */
    private function dropIndexIfExists($indexName): void
    {
        try {
            DB::statement("DROP INDEX IF EXISTS {$indexName}");
        } catch (\Exception $e) {
            // Index might not exist, silently continue
        }
    }
};
