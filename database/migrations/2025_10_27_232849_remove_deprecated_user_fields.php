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
            // Remove deprecated fields that are being replaced
            if (Schema::hasColumn('users', 'barangay')) {
                $table->dropColumn('barangay');
            }
            if (Schema::hasColumn('users', 'location')) {
                $table->dropColumn('location');
            }
            if (Schema::hasColumn('users', 'experience_level')) {
                $table->dropColumn('experience_level');
            }
            if (Schema::hasColumn('users', 'skills')) {
                $table->dropColumn('skills');
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
            $table->string('barangay')->nullable();
            $table->string('location')->nullable();
            $table->enum('experience_level', ['beginner', 'intermediate', 'expert'])->nullable();
            $table->json('skills')->nullable();
        });
    }
};
