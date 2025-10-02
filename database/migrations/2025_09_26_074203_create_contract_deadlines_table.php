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
        Schema::create('contract_deadlines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('projects')->onDelete('cascade');
            $table->string('milestone_name', 255);
            $table->date('due_date');
            $table->enum('status', ['pending', 'overdue', 'completed'])->default('pending');
            $table->boolean('reminder_sent')->default(false);
            $table->timestamps();

            $table->index(['contract_id', 'status']);
            $table->index(['due_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_deadlines');
    }
};
