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
        Schema::create('job_workflow_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_job_id')->constrained('workflow_jobs')->cascadeOnDelete();
            $table->foreignId('flow_id')->constrained('flows')->cascadeOnDelete();
            $table->integer('sequence')->default(0);
            $table->enum('status', ['pending', 'running', 'completed', 'failed', 'skipped'])->default('pending');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('config')->nullable();
            $table->integer('total_tasks')->default(0);
            $table->integer('completed_tasks')->default(0);
            $table->integer('failed_tasks')->default(0);
            $table->timestamps();

            $table->unique(['workflow_job_id', 'sequence']);
            $table->index(['workflow_job_id', 'status']);
        });

        // Make flow_id nullable on workflow_jobs for backward compatibility
        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->unsignedBigInteger('flow_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_workflow_items');

        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->unsignedBigInteger('flow_id')->nullable(false)->change();
        });
    }
};
