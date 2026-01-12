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
        Schema::create('data_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->default('📊'); // Emoji or icon name
            $table->string('color')->default('#3b82f6'); // Hex color code
            $table->integer('total_records')->default(0); // Cache for performance
            $table->json('schema')->nullable(); // Field definitions: [{name, type, required, default}]
            $table->timestamps();

            // Indexes for performance
            $table->index('user_id');
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_collections');
    }
};
