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
        Schema::table('marketplace_listings', function (Blueprint $table) {
            $table->json('bundled_collection_ids')->nullable()->after('tags')
                ->comment('IDs of DataCollections bundled with this workflow listing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('marketplace_listings', function (Blueprint $table) {
            $table->dropColumn('bundled_collection_ids');
        });
    }
};
