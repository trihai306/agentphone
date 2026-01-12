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
        Schema::create('error_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('error_type', ['bug', 'ui_issue', 'performance', 'feature_request', 'other'])->default('bug');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['pending', 'reviewing', 'in_progress', 'resolved', 'closed'])->default('pending');
            $table->string('page_url')->nullable();
            $table->json('device_info')->nullable();
            $table->json('screenshots')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            // Indexes for better performance
            $table->index(['user_id', 'status']);
            $table->index('status');
            $table->index('severity');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('error_reports');
    }
};
