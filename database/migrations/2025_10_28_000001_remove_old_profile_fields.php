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
        Schema::table('users', function (Blueprint $table) {
            // Remove deprecated fields
            // Note: province and municipality are NEW fields (added in 2025_10_27_232857_add_location_hierarchy_fields)
            // Do NOT remove them here
            if (Schema::hasColumn('users', 'experience_level')) {
                $table->dropColumn('experience_level');
            }
            if (Schema::hasColumn('users', 'languages')) {
                $table->dropColumn('languages');
            }
            if (Schema::hasColumn('users', 'portfolio_url')) {
                $table->dropColumn('portfolio_url');
            }
            // province and municipality are kept - they are new location hierarchy fields
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore removed columns
            $table->enum('experience_level', ['beginner', 'intermediate', 'expert'])->nullable();
            $table->json('languages')->nullable();
            $table->string('portfolio_url')->nullable();
            // Note: province and municipality are handled by add_location_hierarchy_fields migration
        });
    }
};



