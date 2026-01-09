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
        Schema::create('user_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // File info
            $table->string('filename'); // Stored filename (unique)
            $table->string('original_name'); // Original upload filename
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size'); // In bytes
            $table->string('path'); // Storage path
            $table->string('thumbnail_path')->nullable(); // Thumbnail for images/videos

            // Organization
            $table->string('folder')->default('/'); // Virtual folder path
            $table->json('tags')->nullable(); // Array of tags for filtering

            // Metadata
            $table->json('metadata')->nullable(); // Width, height, duration, etc.
            $table->string('alt_text')->nullable(); // Alt text for images
            $table->text('description')->nullable();

            // Settings
            $table->boolean('is_public')->default(false);
            $table->unsignedInteger('download_count')->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['user_id', 'folder']);
            $table->index(['user_id', 'mime_type']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_media');
    }
};
