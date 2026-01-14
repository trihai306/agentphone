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
        Schema::create('workflow_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('flow_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('status', [
                'pending',      // Chờ xử lý
                'queued',       // Đã vào queue
                'running',      // Đang chạy
                'completed',    // Hoàn thành
                'failed',       // Thất bại
                'cancelled'     // Đã huỷ
            ])->default('pending');
            $table->tinyInteger('priority')->default(5)->comment('1-10, higher = more priority');
            $table->timestamp('scheduled_at')->nullable()->comment('Null = run immediately');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->unsignedInteger('max_retries')->default(3);
            $table->json('config')->nullable()->comment('Job configuration: variables, options');
            $table->json('result')->nullable()->comment('Execution result');
            $table->unsignedInteger('total_tasks')->default(0);
            $table->unsignedInteger('completed_tasks')->default(0);
            $table->unsignedInteger('failed_tasks')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('status');
            $table->index('scheduled_at');
            $table->index(['user_id', 'status']);
            $table->index(['device_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_jobs');
    }
};
