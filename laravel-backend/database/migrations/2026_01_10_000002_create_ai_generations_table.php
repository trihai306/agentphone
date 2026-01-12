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
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('User tạo generation');
            $table->enum('type', ['image', 'video'])->comment('Loại generation');
            $table->string('model')->comment('Model name (VD: flux-1.1-pro)');
            $table->text('prompt')->comment('Text prompt từ user');
            $table->text('negative_prompt')->nullable()->comment('Negative prompt');
            $table->json('parameters')->nullable()->comment('Settings (size, quality, steps, etc.)');
            $table->integer('credits_used')->comment('Credits đã tiêu tốn');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->comment('Trạng thái generation');
            $table->string('result_url')->nullable()->comment('URL file đã tạo');
            $table->string('result_path')->nullable()->comment('Path trong storage');
            $table->string('provider_id')->nullable()->comment('ID từ provider API');
            $table->json('provider_metadata')->nullable()->comment('Response metadata từ provider');
            $table->text('error_message')->nullable()->comment('Lỗi nếu failed');
            $table->integer('processing_time')->nullable()->comment('Thời gian xử lý (seconds)');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['type', 'status']);
            $table->index('created_at');
            $table->index('provider_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generations');
    }
};
