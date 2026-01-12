<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change event column from ENUM to VARCHAR to allow more flexibility
        DB::statement("ALTER TABLE device_activity_logs MODIFY event VARCHAR(50) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original ENUM
        DB::statement("ALTER TABLE device_activity_logs MODIFY event ENUM('connected', 'disconnected', 'heartbeat', 'app_opened', 'app_closed') NOT NULL");
    }
};
