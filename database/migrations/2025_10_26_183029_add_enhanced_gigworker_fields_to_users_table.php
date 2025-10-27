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
            // Hierarchical skills data
            $table->string('broad_category')->nullable()->after('skills');
            $table->json('specific_services')->nullable()->after('broad_category');
            $table->json('skills_with_experience')->nullable()->after('specific_services');
            
            // Availability and communication
            $table->json('working_hours')->nullable()->after('skills_with_experience');
            $table->string('timezone')->nullable()->after('working_hours');
            $table->json('preferred_communication')->nullable()->after('timezone');
            $table->text('availability_notes')->nullable()->after('preferred_communication');
            
            // ID Verification
            $table->string('id_type')->nullable()->after('availability_notes');
            $table->string('id_front_image')->nullable()->after('id_type');
            $table->string('id_back_image')->nullable()->after('id_front_image');
            $table->enum('id_verification_status', ['pending', 'verified', 'rejected'])->default('pending')->after('id_back_image');
            $table->text('id_verification_notes')->nullable()->after('id_verification_status');
            $table->timestamp('id_verified_at')->nullable()->after('id_verification_notes');
            
            // Onboarding progress
            $table->boolean('tutorial_completed')->default(false)->after('profile_completed');
            $table->integer('onboarding_step')->default(0)->after('tutorial_completed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'broad_category',
                'specific_services',
                'skills_with_experience',
                'working_hours',
                'timezone',
                'preferred_communication',
                'availability_notes',
                'id_type',
                'id_front_image',
                'id_back_image',
                'id_verification_status',
                'id_verification_notes',
                'id_verified_at',
                'tutorial_completed',
                'onboarding_step',
            ]);
        });
    }
};
