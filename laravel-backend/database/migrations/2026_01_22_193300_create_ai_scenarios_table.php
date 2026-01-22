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
        Schema::create('ai_scenarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title')->nullable()->comment('Tiêu đề kịch bản');
            $table->text('script')->comment('Kịch bản gốc từ user');
            $table->enum('output_type', ['image', 'video'])->default('video')->comment('Loại output');
            $table->string('model')->comment('Model AI để generate');
            $table->json('settings')->nullable()->comment('Cài đặt chung (duration, resolution...)');
            $table->enum('status', ['draft', 'parsed', 'generating', 'completed', 'failed', 'partial'])
                ->default('draft')->comment('Trạng thái scenario');
            $table->integer('total_credits')->default(0)->comment('Tổng credits cần/đã dùng');
            $table->text('error_message')->nullable()->comment('Lỗi nếu failed');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('created_at');
        });

        Schema::create('ai_scenario_scenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_scenario_id')->constrained()->onDelete('cascade');
            $table->integer('order')->comment('Thứ tự scene');
            $table->text('description')->comment('Mô tả scene từ AI');
            $table->text('prompt')->comment('Prompt đã format cho generation');
            $table->integer('duration')->nullable()->comment('Duration cho video (seconds)');
            $table->foreignId('ai_generation_id')->nullable()
                ->constrained('ai_generations')->nullOnDelete()
                ->comment('Link tới generation đã tạo');
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])
                ->default('pending')->comment('Trạng thái scene');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['ai_scenario_id', 'order']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_scenario_scenes');
        Schema::dropIfExists('ai_scenarios');
    }
};
