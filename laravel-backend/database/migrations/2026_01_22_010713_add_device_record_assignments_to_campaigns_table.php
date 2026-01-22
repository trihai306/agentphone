<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            // Manual device-to-records assignment
            // Format: {"device_id_1": [record_id_1, record_id_2], "device_id_2": [record_id_3]}
            $table->json('device_record_assignments')->nullable()->after('data_config');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('device_record_assignments');
        });
    }
};
