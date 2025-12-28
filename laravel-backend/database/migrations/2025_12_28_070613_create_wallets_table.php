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
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('User sở hữu ví');
            $table->decimal('balance', 20, 2)->default(0)->comment('Số dư hiện tại');
            $table->decimal('locked_balance', 20, 2)->default(0)->comment('Số dư bị khóa (đang xử lý)');
            $table->string('currency', 3)->default('VND')->comment('Loại tiền tệ');
            $table->boolean('is_active')->default(true)->comment('Trạng thái ví');
            $table->timestamps();

            $table->unique(['user_id', 'currency']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
