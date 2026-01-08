<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_service_packages', function (Blueprint $table) {
            // Make service_package_id nullable for credit topups
            $table->foreignId('service_package_id')->nullable()->change();

            // Add metadata column for storing additional info
            $table->json('metadata')->nullable()->after('user_note')->comment('Additional metadata (package info, bonus credits, etc.)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_service_packages', function (Blueprint $table) {
            $table->foreignId('service_package_id')->nullable(false)->change();
            $table->dropColumn('metadata');
        });
    }
};
