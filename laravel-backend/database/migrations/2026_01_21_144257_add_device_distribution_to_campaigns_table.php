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
            // Max records per device (null = auto divide equally)
            $table->unsignedInteger('records_per_device')->nullable()->after('records_per_batch');

            // Device allocation strategy
            $table->enum('device_allocation', ['equal', 'round_robin', 'manual'])
                ->default('equal')
                ->after('records_per_device');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn(['records_per_device', 'device_allocation']);
        });
    }
};
