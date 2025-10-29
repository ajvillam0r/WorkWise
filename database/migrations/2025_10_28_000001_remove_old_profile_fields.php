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
            if (Schema::hasColumn('users', 'experience_level')) {
                $table->dropColumn('experience_level');
            }
            if (Schema::hasColumn('users', 'languages')) {
                $table->dropColumn('languages');
            }
            if (Schema::hasColumn('users', 'portfolio_url')) {
                $table->dropColumn('portfolio_url');
            }
            if (Schema::hasColumn('users', 'province')) {
                $table->dropColumn('province');
            }
            if (Schema::hasColumn('users', 'municipality')) {
                $table->dropColumn('municipality');
            }
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
            $table->string('province')->nullable();
            $table->string('municipality')->nullable();
        });
    }
};



