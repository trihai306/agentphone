<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('Mã gói dịch vụ');
            $table->string('name')->comment('Tên gói dịch vụ');
            $table->text('description')->nullable()->comment('Mô tả chi tiết');
            $table->string('type')->default('subscription')->comment('Loại gói: subscription, one_time, credits');
            $table->decimal('price', 15, 2)->default(0)->comment('Giá gói dịch vụ');
            $table->decimal('original_price', 15, 2)->nullable()->comment('Giá gốc (để hiển thị giảm giá)');
            $table->string('currency', 10)->default('VND')->comment('Đơn vị tiền tệ');
            $table->integer('duration_days')->nullable()->comment('Thời hạn gói (ngày) - dùng cho subscription');
            $table->integer('credits')->nullable()->comment('Số credits được cấp - dùng cho gói credits');
            $table->json('features')->nullable()->comment('Danh sách tính năng của gói');
            $table->json('limits')->nullable()->comment('Giới hạn sử dụng (API calls, storage, etc.)');
            $table->integer('max_devices')->nullable()->comment('Số thiết bị tối đa được sử dụng');
            $table->integer('priority')->default(0)->comment('Thứ tự ưu tiên hiển thị');
            $table->boolean('is_featured')->default(false)->comment('Gói nổi bật');
            $table->boolean('is_active')->default(true)->comment('Trạng thái hoạt động');
            $table->boolean('is_trial')->default(false)->comment('Gói dùng thử');
            $table->integer('trial_days')->nullable()->comment('Số ngày dùng thử');
            $table->string('badge')->nullable()->comment('Badge hiển thị (VD: Hot, Best Seller)');
            $table->string('badge_color')->nullable()->comment('Màu badge');
            $table->string('icon')->nullable()->comment('Icon của gói');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'is_active']);
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_packages');
    }
};
