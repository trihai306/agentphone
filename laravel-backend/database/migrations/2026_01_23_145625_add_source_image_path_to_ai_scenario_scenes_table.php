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
        Schema::table('ai_scenario_scenes', function (Blueprint $table) {
            $table->string('source_image_path')->nullable()->after('duration')
                ->comment('Reference image path for Image-to-Video generation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_scenario_scenes', function (Blueprint $table) {
            $table->dropColumn('source_image_path');
        });
    }
};
