<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->default('🌱');
            $table->string('color')->default('#8b5cf6');

            // Data source
            $table->foreignId('data_collection_id')->nullable()->constrained()->nullOnDelete();

            // Execution settings
            $table->enum('execution_mode', ['sequential', 'parallel'])->default('sequential');
            $table->integer('records_per_batch')->default(10);
            $table->integer('repeat_per_record')->default(1);
            $table->json('record_filter')->nullable(); // {"status": "active"}
            $table->enum('device_strategy', ['round_robin', 'random', 'specific'])->default('round_robin');

            // Scheduling
            $table->json('schedule')->nullable(); // {"type": "cron", "value": "0 9 * * *"}

            // Status & stats
            $table->enum('status', ['draft', 'active', 'paused', 'completed'])->default('draft');
            $table->integer('total_records')->default(0);
            $table->integer('records_processed')->default(0);
            $table->integer('records_success')->default(0);
            $table->integer('records_failed')->default(0);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'status']);
        });

        // Pivot: Campaign -> Workflows (ordered)
        Schema::create('campaign_workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('flow_id')->constrained()->cascadeOnDelete();
            $table->integer('sequence')->default(0);
            $table->timestamps();

            $table->unique(['campaign_id', 'flow_id']);
            $table->index(['campaign_id', 'sequence']);
        });

        // Pivot: Campaign -> Devices
        Schema::create('campaign_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['campaign_id', 'device_id']);
        });

        // Add campaign reference to workflow_jobs
        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->foreignId('campaign_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->json('record_data')->nullable()->after('data_record_ids');
            $table->string('batch_id')->nullable()->after('record_data')->index();
        });
    }

    public function down(): void
    {
        Schema::table('workflow_jobs', function (Blueprint $table) {
            $table->dropForeign(['campaign_id']);
            $table->dropColumn(['campaign_id', 'record_data', 'batch_id']);
        });

        Schema::dropIfExists('campaign_devices');
        Schema::dropIfExists('campaign_workflows');
        Schema::dropIfExists('campaigns');
    }
};
