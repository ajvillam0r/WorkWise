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
        // Check if columns exist and add only if they don't
        if (!Schema::hasColumn('gig_jobs', 'project_category')) {
            Schema::table('gig_jobs', function (Blueprint $table) {
                $table->string('project_category')->nullable()->after('description');
            });
        }
        
        if (!Schema::hasColumn('gig_jobs', 'job_complexity')) {
            Schema::table('gig_jobs', function (Blueprint $table) {
                $table->enum('job_complexity', ['simple', 'moderate', 'complex', 'expert'])->nullable()->after('experience_level');
            });
        }
        
        if (!Schema::hasColumn('gig_jobs', 'skills_requirements')) {
            Schema::table('gig_jobs', function (Blueprint $table) {
                $table->json('skills_requirements')->nullable()->after('required_skills');
            });
        }
        
        if (!Schema::hasColumn('gig_jobs', 'nice_to_have_skills')) {
            Schema::table('gig_jobs', function (Blueprint $table) {
                $table->json('nice_to_have_skills')->nullable()->after('skills_requirements');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gig_jobs', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('gig_jobs', 'project_category')) {
                $columns[] = 'project_category';
            }
            if (Schema::hasColumn('gig_jobs', 'job_complexity')) {
                $columns[] = 'job_complexity';
            }
            if (Schema::hasColumn('gig_jobs', 'skills_requirements')) {
                $columns[] = 'skills_requirements';
            }
            if (Schema::hasColumn('gig_jobs', 'nice_to_have_skills')) {
                $columns[] = 'nice_to_have_skills';
            }
            
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
