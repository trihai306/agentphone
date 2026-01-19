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
        Schema::table('ai_generations', function (Blueprint $table) {
            // Provider identifier (replicate, gemini-veo, kling)
            $table->string('provider')->default('replicate')->after('model');

            // Video-specific fields
            $table->string('aspect_ratio')->nullable()->after('parameters');
            $table->string('resolution')->nullable()->after('aspect_ratio');

            // Image-to-video source image
            $table->string('source_image_path')->nullable()->after('resolution');

            // Audio generation support (Veo 3, Kling)
            $table->boolean('has_audio')->default(false)->after('source_image_path');

            // Add index for provider queries
            $table->index('provider');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_generations', function (Blueprint $table) {
            $table->dropIndex(['provider']);
            $table->dropColumn([
                'provider',
                'aspect_ratio',
                'resolution',
                'source_image_path',
                'has_audio',
            ]);
        });
    }
};
