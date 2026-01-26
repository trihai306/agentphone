<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Add 'queued' status to ai_scenarios table
     */
    public function up(): void
    {
        // MySQL: Alter ENUM to add 'queued' status
        DB::statement("ALTER TABLE ai_scenarios MODIFY COLUMN status ENUM('draft', 'parsed', 'queued', 'generating', 'completed', 'failed', 'partial') DEFAULT 'draft'");
    }

    /**
     * Remove 'queued' status (rollback)
     */
    public function down(): void
    {
        // First update any 'queued' to 'parsed' before removing the enum value
        DB::table('ai_scenarios')->where('status', 'queued')->update(['status' => 'parsed']);

        DB::statement("ALTER TABLE ai_scenarios MODIFY COLUMN status ENUM('draft', 'parsed', 'generating', 'completed', 'failed', 'partial') DEFAULT 'draft'");
    }
};
