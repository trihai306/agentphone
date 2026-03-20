<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE recording_sessions MODIFY COLUMN status ENUM('started', 'recording', 'stopped', 'completed', 'saved', 'failed') NOT NULL DEFAULT 'started'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE recording_sessions MODIFY COLUMN status ENUM('started', 'stopped', 'saved', 'failed') NOT NULL DEFAULT 'started'");
    }
};
