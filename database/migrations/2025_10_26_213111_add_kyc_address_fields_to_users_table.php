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
            // Country detected at registration
            $table->string('country')->nullable()->after('location');
            
            // Complete address collected during KYC/ID verification
            $table->string('street_address')->nullable()->after('country');
            $table->string('city')->nullable()->after('street_address');
            $table->string('postal_code', 20)->nullable()->after('city');
            
            // Timestamp when address was verified during KYC
            $table->timestamp('address_verified_at')->nullable()->after('postal_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'country',
                'street_address',
                'city',
                'postal_code',
                'address_verified_at'
            ]);
        });
    }
};
