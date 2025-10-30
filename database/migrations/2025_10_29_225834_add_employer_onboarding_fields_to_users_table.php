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
            // Step 1: Company/Individual Information
            $table->enum('company_size', ['individual', '2-10', '11-50', '51-200', '200+'])->nullable()->after('company_name');
            $table->string('industry')->nullable()->after('company_size');
            $table->string('company_website')->nullable()->after('industry');
            $table->text('company_description')->nullable()->after('company_website');
            
            // Step 2: Hiring Preferences
            $table->json('primary_hiring_needs')->nullable()->after('company_description'); // Array of service categories
            $table->enum('typical_project_budget', ['under_500', '500-2000', '2000-5000', '5000-10000', '10000+'])->nullable()->after('primary_hiring_needs');
            $table->enum('typical_project_duration', ['short_term', 'medium_term', 'long_term', 'ongoing'])->nullable()->after('typical_project_budget');
            $table->enum('preferred_experience_level', ['any', 'beginner', 'intermediate', 'expert'])->nullable()->after('typical_project_duration');
            $table->enum('hiring_frequency', ['one_time', 'occasional', 'regular', 'ongoing'])->nullable()->after('preferred_experience_level');
            
            // Step 3: Verification (optional)
            $table->string('business_registration_document')->nullable()->after('hiring_frequency');
            $table->string('tax_id')->nullable()->after('business_registration_document');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'company_size',
                'industry',
                'company_website',
                'company_description',
                'primary_hiring_needs',
                'typical_project_budget',
                'typical_project_duration',
                'preferred_experience_level',
                'hiring_frequency',
                'business_registration_document',
                'tax_id'
            ]);
        });
    }
};
