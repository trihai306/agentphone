<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('recording_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('session_id')->unique();
            $table->enum('status', ['started', 'stopped', 'saved', 'failed'])->default('started');
            $table->timestamp('started_at');
            $table->timestamp('stopped_at')->nullable();
            $table->integer('duration')->nullable()->comment('Duration in milliseconds');
            $table->integer('event_count')->nullable();
            $table->string('target_app')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recording_sessions');
    }
};
