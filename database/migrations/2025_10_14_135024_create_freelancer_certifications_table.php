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
        Schema::create('freelancer_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            
            $table->string('name');
            $table->string('issuing_organization');
            $table->text('description')->nullable();
            $table->date('issue_date');
            $table->date('expiration_date')->nullable();
            $table->boolean('does_not_expire')->default(false);
            $table->string('credential_id')->nullable();
            $table->string('credential_url')->nullable();
            $table->json('skills_validated')->nullable(); // Array of skills this certification validates
            $table->string('certificate_file')->nullable(); // Path to certificate file
            $table->boolean('is_verified')->default(false);
            $table->integer('display_order')->default(0);
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['issuing_organization']);
            $table->index(['is_verified']);
            $table->index(['display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_certifications');
    }
};
