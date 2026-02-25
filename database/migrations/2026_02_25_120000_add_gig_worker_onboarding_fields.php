<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'professional_title')) {
                $table->string('professional_title')->nullable()->after('bio');
            }
            if (!Schema::hasColumn('users', 'hourly_rate')) {
                $table->decimal('hourly_rate', 10, 2)->nullable()->after('professional_title');
            }
            if (!Schema::hasColumn('users', 'skills_with_experience')) {
                $table->json('skills_with_experience')->nullable()->after('hourly_rate');
            }
            if (!Schema::hasColumn('users', 'portfolio_link')) {
                $table->string('portfolio_link')->nullable()->after('skills_with_experience');
            }
            if (!Schema::hasColumn('users', 'resume_file')) {
                $table->string('resume_file')->nullable()->after('portfolio_link');
            }
            if (!Schema::hasColumn('users', 'onboarding_step')) {
                $table->integer('onboarding_step')->default(0)->after('profile_completed');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = ['professional_title', 'hourly_rate', 'skills_with_experience', 'portfolio_link', 'resume_file', 'onboarding_step'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
