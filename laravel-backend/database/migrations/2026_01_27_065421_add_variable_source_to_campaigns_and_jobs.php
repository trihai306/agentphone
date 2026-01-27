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
        // Add variable source columns to campaign_workflows pivot table
        Schema::table('campaign_workflows', function (Blueprint $table) {
            $table->unsignedBigInteger('variable_source_collection_id')->nullable()->after('conditions');
            $table->enum('iteration_strategy', ['sequential', 'random'])->default('sequential')->after('variable_source_collection_id');

            $table->foreign('variable_source_collection_id')
                ->references('id')
                ->on('data_collections')
                ->onDelete('set null');
        });

        // Add iteration metadata columns to workflow_jobs table
        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->unsignedBigInteger('variable_source_collection_id')->nullable()->after('data_record_id');
            $table->integer('iteration_index')->default(0)->after('variable_source_collection_id');

            $table->foreign('variable_source_collection_id')
                ->references('id')
                ->on('data_collections')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaign_workflows', function (Blueprint $table) {
            $table->dropForeign(['variable_source_collection_id']);
            $table->dropColumn(['variable_source_collection_id', 'iteration_strategy']);
        });

        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->dropForeign(['variable_source_collection_id']);
            $table->dropColumn(['variable_source_collection_id', 'iteration_index']);
        });
    }
};
