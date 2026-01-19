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
        Schema::table('user_media', function (Blueprint $table) {
            $table->string('source', 20)->default('upload')->after('folder');
            $table->foreignId('ai_generation_id')->nullable()->after('source')
                ->constrained('ai_generations')->nullOnDelete();

            // Index for filtering AI generated media
            $table->index('source');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_media', function (Blueprint $table) {
            $table->dropForeign(['ai_generation_id']);
            $table->dropIndex(['source']);
            $table->dropColumn(['source', 'ai_generation_id']);
        });
    }
};
