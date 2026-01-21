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
        Schema::table('workflow_jobs', function (Blueprint $table) {
            // Single record instead of batch (nullable for backward compatibility)
            $table->unsignedBigInteger('data_record_id')->nullable()->after('data_collection_id');

            // Workflow chain: array of workflow IDs to execute in sequence
            $table->json('workflow_chain')->nullable()->after('data_record_id');

            // Context data passed between workflows in the chain
            $table->json('chain_context')->nullable()->after('workflow_chain');

            // Index for efficient querying
            $table->index('data_record_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->dropIndex(['data_record_id']);
            $table->dropColumn(['data_record_id', 'workflow_chain', 'chain_context']);
        });
    }
};
