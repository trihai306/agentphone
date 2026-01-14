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
        Schema::create('job_tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_job_id');
            $table->foreign('workflow_job_id')->references('id')->on('workflow_jobs')->cascadeOnDelete();
            $table->foreignId('flow_node_id')->nullable()->constrained()->nullOnDelete();
            $table->string('node_id')->comment('React Flow node ID');
            $table->string('node_type')->comment('Type of node: tap, click, input, etc');
            $table->string('node_label')->nullable();
            $table->unsignedInteger('sequence')->comment('Execution order');
            $table->enum('status', [
                'pending',
                'running',
                'completed',
                'failed',
                'skipped'
            ])->default('pending');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('input_data')->nullable()->comment('Data sent to device');
            $table->json('output_data')->nullable()->comment('Result from device');
            $table->text('error_message')->nullable();
            $table->unsignedInteger('duration_ms')->nullable()->comment('Execution time in milliseconds');
            $table->timestamps();

            // Indexes
            $table->index('status');
            $table->index(['workflow_job_id', 'sequence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_tasks');
    }
};
