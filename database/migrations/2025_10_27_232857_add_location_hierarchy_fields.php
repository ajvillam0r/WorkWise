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
            // Add location hierarchy fields
            if (!Schema::hasColumn('users', 'province')) {
                $table->string('province')->nullable()->after('country');
            }
            if (!Schema::hasColumn('users', 'municipality')) {
                $table->string('municipality')->nullable()->after('city');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove location hierarchy fields
            if (Schema::hasColumn('users', 'province')) {
                $table->dropColumn('province');
            }
            if (Schema::hasColumn('users', 'municipality')) {
                $table->dropColumn('municipality');
            }
        });
    }
};
