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
        Schema::create('freelancer_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained()->onDelete('cascade');
            
            $table->string('institution_name');
            $table->string('degree_type'); // Bachelor's, Master's, PhD, Certificate, etc.
            $table->string('field_of_study');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->decimal('gpa', 3, 2)->nullable();
            $table->string('location')->nullable();
            $table->text('activities_and_societies')->nullable();
            $table->integer('display_order')->default(0);
            
            $table->timestamps();
            
            $table->index(['freelancer_id']);
            $table->index(['is_current']);
            $table->index(['display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_educations');
    }
};
