<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Add character consistency and frame chaining support
     */
    public function up(): void
    {
        // Add chain mode and characters to scenarios
        Schema::table('ai_scenarios', function (Blueprint $table) {
            $table->enum('chain_mode', ['none', 'frame_chain'])
                ->default('none')
                ->after('settings')
                ->comment('Video chaining mode: none = parallel, frame_chain = sequential with frame extraction');

            $table->json('characters')
                ->nullable()
                ->after('chain_mode')
                ->comment('Character definitions for consistency across scenes');
        });

        // Add reference image path to scenes for frame chaining
        Schema::table('ai_scenario_scenes', function (Blueprint $table) {
            $table->string('reference_image_path')
                ->nullable()
                ->after('source_image_path')
                ->comment('Extracted frame from previous video for seamless transition');

            $table->json('character_refs')
                ->nullable()
                ->after('reference_image_path')
                ->comment('Character reference data for this scene');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_scenarios', function (Blueprint $table) {
            $table->dropColumn(['chain_mode', 'characters']);
        });

        Schema::table('ai_scenario_scenes', function (Blueprint $table) {
            $table->dropColumn(['reference_image_path', 'character_refs']);
        });
    }
};
