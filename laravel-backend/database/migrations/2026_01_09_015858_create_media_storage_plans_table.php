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
        Schema::create('media_storage_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Free, Basic, Pro, Enterprise
            $table->string('slug')->unique(); // free, basic, pro, enterprise
            $table->text('description')->nullable();

            // Storage limits
            $table->unsignedBigInteger('max_storage_bytes'); // Total storage in bytes
            $table->unsignedInteger('max_files')->nullable(); // Max number of files (null = unlimited)
            $table->unsignedBigInteger('max_file_size_bytes')->default(52428800); // Max single file size (default 50MB)

            // Pricing
            $table->decimal('price', 10, 2)->default(0); // Price in VND
            $table->enum('billing_period', ['monthly', 'yearly'])->default('monthly');

            // Features (JSON for flexibility)
            $table->json('features')->nullable(); // Array of feature descriptions

            // Display
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_default')->default(false); // One plan should be default for new users

            $table->timestamps();

            $table->index('slug');
            $table->index(['is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_storage_plans');
    }
};
