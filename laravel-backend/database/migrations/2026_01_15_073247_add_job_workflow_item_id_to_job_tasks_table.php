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
        Schema::table('job_tasks', function (Blueprint $table) {
            $table->foreignId('job_workflow_item_id')
                ->nullable()
                ->after('workflow_job_id')
                ->constrained('job_workflow_items')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_tasks', function (Blueprint $table) {
            $table->dropForeign(['job_workflow_item_id']);
            $table->dropColumn('job_workflow_item_id');
        });
    }
};
