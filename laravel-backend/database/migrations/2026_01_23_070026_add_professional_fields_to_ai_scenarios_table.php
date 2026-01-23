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
        Schema::table('ai_scenarios', function (Blueprint $table) {
            // Dùng lại user_media_folders có sẵn thay vì tạo scenario_folders riêng
            $table->foreignId('folder_id')->nullable()->after('user_id')->constrained('user_media_folders')->onDelete('set null');
            $table->foreignId('template_id')->nullable()->after('folder_id')->constrained('scenario_templates')->onDelete('set null');
            $table->boolean('is_draft')->default(false)->after('status');
            $table->json('metadata')->nullable()->after('settings'); // tags, category, etc.
            $table->timestamp('published_at')->nullable()->after('is_draft');

            $table->index('folder_id');
            $table->index('is_draft');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_scenarios', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropForeign(['template_id']);
            $table->dropColumn(['folder_id', 'template_id', 'is_draft', 'metadata', 'published_at']);
        });
    }
};
