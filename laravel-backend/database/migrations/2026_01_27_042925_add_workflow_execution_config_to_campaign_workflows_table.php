<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('campaign_workflows', function (Blueprint $table) {
            // Per-workflow execution configuration
            $table->integer('repeat_count')->default(1)->after('sequence')
                ->comment('Number of times to execute this workflow per record');

            $table->enum('execution_mode', ['once', 'repeat', 'conditional'])
                ->default('once')->after('repeat_count')
                ->comment('once: run 1×/record, repeat: run N×, conditional: advanced');

            $table->integer('delay_between_repeats')->nullable()->after('execution_mode')
                ->comment('Delay in seconds between repetitions of this workflow');

            $table->json('conditions')->nullable()->after('delay_between_repeats')
                ->comment('Conditional execution rules (future feature)');

            // Index for commonly queried fields
            $table->index(['campaign_id', 'execution_mode']);
        });
    }

    public function down(): void
    {
        Schema::table('campaign_workflows', function (Blueprint $table) {
            $table->dropIndex(['campaign_id', 'execution_mode']);
            $table->dropColumn([
                'repeat_count',
                'execution_mode',
                'delay_between_repeats',
                'conditions'
            ]);
        });
    }
};
