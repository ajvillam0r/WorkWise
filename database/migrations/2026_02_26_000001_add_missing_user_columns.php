<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable();
            }
            if (!Schema::hasColumn('users', 'broad_category')) {
                $table->string('broad_category')->nullable();
            }
            if (!Schema::hasColumn('users', 'specific_services')) {
                $table->json('specific_services')->nullable();
            }
            if (!Schema::hasColumn('users', 'working_hours')) {
                $table->json('working_hours')->nullable();
            }
            if (!Schema::hasColumn('users', 'timezone')) {
                $table->string('timezone')->nullable();
            }
            if (!Schema::hasColumn('users', 'preferred_communication')) {
                $table->json('preferred_communication')->nullable();
            }
            if (!Schema::hasColumn('users', 'availability_notes')) {
                $table->text('availability_notes')->nullable();
            }
            if (!Schema::hasColumn('users', 'id_type')) {
                $table->string('id_type')->nullable();
            }
            if (!Schema::hasColumn('users', 'id_front_image')) {
                $table->string('id_front_image')->nullable();
            }
            if (!Schema::hasColumn('users', 'id_back_image')) {
                $table->string('id_back_image')->nullable();
            }
            if (!Schema::hasColumn('users', 'id_verification_notes')) {
                $table->text('id_verification_notes')->nullable();
            }
            if (!Schema::hasColumn('users', 'id_verified_at')) {
                $table->timestamp('id_verified_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(array_filter([
                Schema::hasColumn('users', 'bio') ? 'bio' : null,
                Schema::hasColumn('users', 'broad_category') ? 'broad_category' : null,
                Schema::hasColumn('users', 'specific_services') ? 'specific_services' : null,
                Schema::hasColumn('users', 'working_hours') ? 'working_hours' : null,
                Schema::hasColumn('users', 'timezone') ? 'timezone' : null,
                Schema::hasColumn('users', 'preferred_communication') ? 'preferred_communication' : null,
                Schema::hasColumn('users', 'availability_notes') ? 'availability_notes' : null,
                Schema::hasColumn('users', 'id_type') ? 'id_type' : null,
                Schema::hasColumn('users', 'id_front_image') ? 'id_front_image' : null,
                Schema::hasColumn('users', 'id_back_image') ? 'id_back_image' : null,
                Schema::hasColumn('users', 'id_verification_notes') ? 'id_verification_notes' : null,
                Schema::hasColumn('users', 'id_verified_at') ? 'id_verified_at' : null,
            ]));
        });
    }
};
