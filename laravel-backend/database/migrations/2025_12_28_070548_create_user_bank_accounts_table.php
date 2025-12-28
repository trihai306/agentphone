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
        Schema::create('user_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('User sở hữu');
            $table->foreignId('bank_id')->constrained()->onDelete('restrict')->comment('Ngân hàng');
            $table->string('account_number')->comment('Số tài khoản');
            $table->string('account_name')->comment('Tên chủ tài khoản');
            $table->string('branch')->nullable()->comment('Chi nhánh');
            $table->boolean('is_verified')->default(false)->comment('Đã xác thực');
            $table->boolean('is_default')->default(false)->comment('Tài khoản mặc định');
            $table->timestamp('verified_at')->nullable()->comment('Thời gian xác thực');
            $table->timestamps();

            $table->index(['user_id', 'is_default']);
            $table->unique(['user_id', 'account_number', 'bank_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_bank_accounts');
    }
};
