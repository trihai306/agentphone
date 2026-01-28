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
        Schema::table('campaign_devices', function (Blueprint $table) {
            $table->foreignId('data_collection_id')
                ->nullable()
                ->after('device_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaign_devices', function (Blueprint $table) {
            $table->dropForeign(['data_collection_id']);
            $table->dropColumn('data_collection_id');
        });
    }
};
