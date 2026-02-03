<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Adds Campaign support to Marketplace + bundled resources tracking
     */
    public function up(): void
    {
        Schema::table('marketplace_listings', function (Blueprint $table) {
            // Store bundled workflow IDs for Campaign listings
            $table->json('bundled_workflow_ids')->nullable()->after('bundled_collection_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('marketplace_listings', function (Blueprint $table) {
            $table->dropColumn('bundled_workflow_ids');
        });
    }
};
