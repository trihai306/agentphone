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
        Schema::create('job_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_job_id');
            $table->foreign('workflow_job_id')->references('id')->on('workflow_jobs')->cascadeOnDelete();
            $table->foreignId('job_task_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('level', ['debug', 'info', 'warning', 'error'])->default('info');
            $table->text('message');
            $table->json('context')->nullable()->comment('Additional metadata');
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index('level');
            $table->index(['workflow_job_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_logs');
    }
};
