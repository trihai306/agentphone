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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_code')->unique()->comment('Mã giao dịch');
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('User thực hiện');
            $table->foreignId('wallet_id')->constrained()->onDelete('restrict')->comment('Ví liên quan');
            $table->enum('type', ['deposit', 'withdrawal'])->comment('Loại giao dịch: nạp/rút');
            $table->decimal('amount', 20, 2)->comment('Số tiền');
            $table->decimal('fee', 20, 2)->default(0)->comment('Phí giao dịch');
            $table->decimal('final_amount', 20, 2)->comment('Số tiền thực nhận/trừ');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])
                ->default('pending')
                ->comment('Trạng thái');

            // Thông tin ngân hàng
            $table->foreignId('user_bank_account_id')->nullable()->constrained()->onDelete('set null')->comment('TK ngân hàng user');
            $table->string('payment_method')->nullable()->comment('Phương thức thanh toán');
            $table->text('payment_details')->nullable()->comment('Chi tiết thanh toán (JSON)');

            // Thông tin xử lý
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null')->comment('Admin duyệt');
            $table->text('admin_note')->nullable()->comment('Ghi chú admin');
            $table->text('user_note')->nullable()->comment('Ghi chú user');
            $table->text('reject_reason')->nullable()->comment('Lý do từ chối');

            // Thông tin chứng từ
            $table->json('proof_images')->nullable()->comment('Ảnh chứng từ');
            $table->string('bank_transaction_id')->nullable()->comment('Mã GD ngân hàng');

            // Thời gian
            $table->timestamp('approved_at')->nullable()->comment('Thời gian duyệt');
            $table->timestamp('completed_at')->nullable()->comment('Thời gian hoàn thành');
            $table->timestamp('cancelled_at')->nullable()->comment('Thời gian hủy');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['transaction_code']);
            $table->index(['status', 'type']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
