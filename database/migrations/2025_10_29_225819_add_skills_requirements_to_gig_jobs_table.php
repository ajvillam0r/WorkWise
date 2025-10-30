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
        Schema::table('gig_jobs', function (Blueprint $table) {
            // Enhanced skill matching fields
            $table->string('project_category')->nullable()->after('employer_id');
            $table->enum('job_complexity', ['simple', 'moderate', 'complex', 'expert'])->nullable()->after('experience_level');
            $table->json('skills_requirements')->nullable()->after('required_skills'); // Main field: [{skill, experience_level, importance}]
            $table->json('nice_to_have_skills')->nullable()->after('skills_requirements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gig_jobs', function (Blueprint $table) {
            $table->dropColumn([
                'project_category',
                'job_complexity',
                'skills_requirements',
                'nice_to_have_skills'
            ]);
        });
    }
};
