<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('portfolio_items', function (Blueprint $table) {
            $table->string('document_file')->nullable()->after('images');
        });

        // Update the enum to include 'resume' option
        // Using raw SQL for MySQL/MariaDB enum modification
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE portfolio_items MODIFY COLUMN project_type ENUM('web', 'mobile', 'design', 'writing', 'other', 'resume') DEFAULT 'other'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('portfolio_items', function (Blueprint $table) {
            $table->dropColumn('document_file');
        });

        // Revert enum back to original
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE portfolio_items MODIFY COLUMN project_type ENUM('web', 'mobile', 'design', 'writing', 'other') DEFAULT 'other'");
        }
    }
};
