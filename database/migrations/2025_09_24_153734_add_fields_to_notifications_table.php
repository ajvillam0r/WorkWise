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
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // contract_signing, bid_status, ai_recommendation, etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional data like job_id, contract_id, etc.
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->string('action_url')->nullable(); // URL to redirect when notification is clicked
            $table->string('icon')->default('bell'); // Icon class for the notification
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'user_id',
                'type',
                'title',
                'message',
                'data',
                'is_read',
                'read_at',
                'action_url',
                'icon'
            ]);
        });
    }
};
