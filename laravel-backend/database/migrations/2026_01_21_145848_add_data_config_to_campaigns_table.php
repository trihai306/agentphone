<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * data_config structure:
     * {
     *   "primary": {
     *     "collection_id": 1,
     *     "mapping": { "username": "username", "password": "password" }
     *   },
     *   "pools": [
     *     {
     *       "variable": "comments",
     *       "collection_id": 5,
     *       "field": "text",
     *       "count": 7,
     *       "mode": "random"
     *     }
     *   ]
     * }
     */
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->json('data_config')->nullable()->after('record_filter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('data_config');
        });
    }
};
