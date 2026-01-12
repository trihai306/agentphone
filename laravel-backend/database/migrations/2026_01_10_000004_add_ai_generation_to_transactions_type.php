<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include 'ai_generation' type
        DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM('deposit', 'withdrawal', 'ai_generation') NOT NULL");

        // Add nullable reference to AI generation
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('ai_generation_id')->nullable()->after('wallet_id')->constrained()->onDelete('set null')->comment('Reference to AI generation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['ai_generation_id']);
            $table->dropColumn('ai_generation_id');
        });

        DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM('deposit', 'withdrawal') NOT NULL");
    }
};
