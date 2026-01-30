<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Main tasks table
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            
            // References
            $table->foreignId('flow_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_collection_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained()->nullOnDelete();
            
            // Task info
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon')->default('📋');
            $table->string('color')->default('#8b5cf6');
            $table->json('tags')->nullable();
            
            // Requirements
            $table->integer('reward_amount')->default(0); // 0 = free task
            $table->integer('required_devices')->default(1);
            $table->integer('accepted_devices')->default(0);
            $table->json('execution_config')->nullable(); // repeat_count, delay, etc.
            $table->boolean('user_provides_data')->default(false); // If true, applicant must provide their own data
            
            // Status & timing
            $table->enum('status', ['open', 'in_progress', 'completed', 'cancelled'])->default('open');
            $table->timestamp('deadline_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['creator_id', 'status']);
            $table->index(['status', 'deadline_at']);
        });

        // Task applications (users applying to accept tasks)
        Schema::create('task_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_collection_id')->nullable()->constrained()->nullOnDelete(); // User's own data if required
            
            // Status
            $table->enum('status', ['pending', 'accepted', 'rejected', 'running', 'completed', 'failed'])->default('pending');
            $table->text('rejection_reason')->nullable();
            
            // Execution tracking
            $table->foreignId('workflow_job_id')->nullable()->constrained()->nullOnDelete();
            $table->json('result')->nullable();
            $table->integer('progress')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            
            // Unique constraint: one device per task
            $table->unique(['task_id', 'device_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_applications');
        Schema::dropIfExists('tasks');
    }
};
