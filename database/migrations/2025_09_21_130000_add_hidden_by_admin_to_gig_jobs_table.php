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
            $table->boolean('hidden_by_admin')->default(false)->after('is_remote');
            $table->index('hidden_by_admin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gig_jobs', function (Blueprint $table) {
            $table->dropIndex(['hidden_by_admin']);
            $table->dropColumn('hidden_by_admin');
        });
    }
};
