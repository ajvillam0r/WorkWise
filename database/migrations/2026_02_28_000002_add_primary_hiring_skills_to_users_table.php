<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'primary_hiring_skills')) {
                $table->json('primary_hiring_skills')->nullable()->after('primary_hiring_needs');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'primary_hiring_skills')) {
                $table->dropColumn('primary_hiring_skills');
            }
        });
    }
};
