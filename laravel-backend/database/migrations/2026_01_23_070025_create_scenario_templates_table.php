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
        Schema::create('scenario_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('category'); // Product, Tutorial, Story, Marketing, etc.
            $table->text('script_template'); // Template with {{placeholders}}
            $table->json('default_settings')->nullable(); // Default video/image settings
            $table->json('scene_structure')->nullable(); // Pre-defined scene count and structure
            $table->string('thumbnail')->nullable(); // Preview image
            $table->boolean('is_public')->default(true);
            $table->boolean('is_premium')->default(false);
            $table->integer('usage_count')->default(0);
            $table->timestamps();

            $table->index('category');
            $table->index('is_public');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scenario_templates');
    }
};
