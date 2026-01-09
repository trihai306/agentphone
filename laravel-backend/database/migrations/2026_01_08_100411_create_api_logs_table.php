<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('api_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('method', 10); // GET, POST, PUT, DELETE
            $table->string('endpoint');
            $table->integer('status_code');
            $table->float('response_time')->nullable(); // in milliseconds
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('request_headers')->nullable();
            $table->json('request_body')->nullable();
            $table->json('response_body')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['endpoint', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('status_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_logs');
    }
};
