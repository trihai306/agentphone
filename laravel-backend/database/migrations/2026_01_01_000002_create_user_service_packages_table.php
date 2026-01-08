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
        Schema::create('user_service_packages', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique()->comment('Mã đơn hàng');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_package_id')->constrained()->onDelete('cascade');
            $table->foreignId('transaction_id')->nullable()->constrained()->onDelete('set null')->comment('Giao dịch thanh toán');
            $table->decimal('price_paid', 15, 2)->comment('Giá đã thanh toán');
            $table->decimal('discount_amount', 15, 2)->default(0)->comment('Số tiền giảm giá');
            $table->string('discount_code')->nullable()->comment('Mã giảm giá đã dùng');
            $table->string('currency', 10)->default('VND');
            $table->string('status')->default('pending')->comment('pending, active, expired, cancelled, refunded');
            $table->string('payment_status')->default('pending')->comment('pending, paid, failed, refunded');
            $table->string('payment_method')->nullable()->comment('Phương thức thanh toán');
            $table->timestamp('activated_at')->nullable()->comment('Thời điểm kích hoạt');
            $table->timestamp('expires_at')->nullable()->comment('Thời điểm hết hạn');
            $table->integer('credits_remaining')->nullable()->comment('Số credits còn lại');
            $table->integer('credits_used')->default(0)->comment('Số credits đã sử dụng');
            $table->json('usage_stats')->nullable()->comment('Thống kê sử dụng');
            $table->boolean('auto_renew')->default(false)->comment('Tự động gia hạn');
            $table->timestamp('renewed_at')->nullable()->comment('Thời điểm gia hạn gần nhất');
            $table->foreignId('renewed_from_id')->nullable()->constrained('user_service_packages')->onDelete('set null')->comment('Gia hạn từ gói nào');
            $table->text('admin_note')->nullable()->comment('Ghi chú của admin');
            $table->text('user_note')->nullable()->comment('Ghi chú của user');
            $table->text('cancel_reason')->nullable()->comment('Lý do hủy');
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
            $table->index(['service_package_id', 'status']);
            $table->index('expires_at');
            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_service_packages');
    }
};
