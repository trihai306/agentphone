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
        Schema::create('banks', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('Mã ngân hàng (VD: VCB, TCB)');
            $table->string('short_name')->comment('Tên viết tắt');
            $table->string('full_name')->comment('Tên đầy đủ');
            $table->string('logo')->nullable()->comment('Logo ngân hàng');
            $table->string('bin')->nullable()->comment('BIN number');
            $table->boolean('is_active')->default(true)->comment('Trạng thái hoạt động');
            $table->integer('sort_order')->default(0)->comment('Thứ tự hiển thị');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banks');
    }
};
