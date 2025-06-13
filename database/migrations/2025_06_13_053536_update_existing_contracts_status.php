<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Update existing contracts to use the new client-first signing workflow
     */
    public function up(): void
    {
        // Update any existing contracts with 'pending_freelancer_signature' status
        // to 'pending_client_signature' to enforce client-first signing
        DB::table('contracts')
            ->where('status', 'pending_freelancer_signature')
            ->whereNull('client_signed_at')
            ->whereNull('freelancer_signed_at')
            ->update(['status' => 'pending_client_signature']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to the old workflow if needed
        DB::table('contracts')
            ->where('status', 'pending_client_signature')
            ->whereNull('client_signed_at')
            ->whereNull('freelancer_signed_at')
            ->update(['status' => 'pending_freelancer_signature']);
    }
};
