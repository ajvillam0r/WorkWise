<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('verification_type', [
                'email', 'phone', 'government_id', 'address', 
                'biometric', 'social_media', 'video_interview',
                'skill_assessment', 'reference_check', 'background_check'
            ]);
            $table->enum('status', ['pending', 'in_progress', 'completed', 'failed', 'expired']);
            $table->json('verification_data')->nullable();
            $table->json('verification_result')->nullable();
            $table->decimal('confidence_score', 3, 2)->nullable(); // 0.00 to 1.00
            $table->text('notes')->nullable();
            $table->string('verified_by')->nullable(); // system, admin, third_party
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'verification_type']);
            $table->index(['status', 'verification_type']);
            $table->unique(['user_id', 'verification_type']);
        });

        Schema::create('verification_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_verification_id')->constrained()->onDelete('cascade');
            $table->string('document_type'); // passport, drivers_license, national_id, etc.
            $table->string('file_path');
            $table->string('file_hash');
            $table->json('extracted_data')->nullable(); // OCR results
            $table->json('validation_results')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });

        Schema::create('biometric_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('biometric_type', ['face', 'voice', 'fingerprint']);
            $table->text('biometric_hash'); // Hashed biometric template
            $table->json('metadata'); // Quality scores, feature points, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamp('enrolled_at');
            $table->timestamps();

            $table->index(['user_id', 'biometric_type']);
        });

        Schema::create('verification_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('verification_type');
            $table->string('ip_address');
            $table->text('user_agent');
            $table->json('attempt_data');
            $table->boolean('successful')->default(false);
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'verification_type', 'successful']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_attempts');
        Schema::dropIfExists('biometric_data');
        Schema::dropIfExists('verification_documents');
        Schema::dropIfExists('user_verifications');
    }
};
