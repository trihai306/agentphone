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
        Schema::create('ai_credit_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('Tên gói credits');
            $table->text('description')->nullable()->comment('Mô tả gói');
            $table->integer('credits')->comment('Số credits trong gói');
            $table->decimal('price', 20, 2)->comment('Giá bán');
            $table->decimal('original_price', 20, 2)->nullable()->comment('Giá gốc (để tính discount)');
            $table->string('currency', 3)->default('VND')->comment('Loại tiền tệ');
            $table->boolean('is_active')->default(true)->comment('Gói có active không');
            $table->boolean('is_featured')->default(false)->comment('Gói nổi bật');
            $table->integer('sort_order')->default(0)->comment('Thứ tự hiển thị');
            $table->string('badge')->nullable()->comment('Label hiển thị (VD: Best Value)');
            $table->string('badge_color')->nullable()->comment('Màu badge');
            $table->timestamps();

            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_credit_packages');
    }
};
