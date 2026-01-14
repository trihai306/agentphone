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
            // Data collection reference
            $table->foreignId('data_collection_id')->nullable()->after('device_id')
                ->constrained()->nullOnDelete();

            // Which records to run (null = all records)
            $table->json('data_record_ids')->nullable()->after('data_collection_id');

            // Execution mode: 'sequential' (one by one) or 'parallel' (batch)
            $table->string('execution_mode', 20)->default('sequential')->after('data_record_ids');

            // Current progress through records
            $table->unsignedInteger('current_record_index')->default(0)->after('execution_mode');

            // Total records to process
            $table->unsignedInteger('total_records_to_process')->default(0)->after('current_record_index');

            // Records processed successfully / failed
            $table->unsignedInteger('records_processed')->default(0)->after('total_records_to_process');
            $table->unsignedInteger('records_failed')->default(0)->after('records_processed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->dropForeign(['data_collection_id']);
            $table->dropColumn([
                'data_collection_id',
                'data_record_ids',
                'execution_mode',
                'current_record_index',
                'total_records_to_process',
                'records_processed',
                'records_failed',
            ]);
        });
    }
};
