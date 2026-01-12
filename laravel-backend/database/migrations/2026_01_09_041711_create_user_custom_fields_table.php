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
        Schema::create('user_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // Field display name
            $table->string('key')->index(); // Slugified field key
            $table->enum('type', [
                'text',
                'number',
                'date',
                'select',
                'multi_select',
                'textarea',
                'url',
                'email',
                'phone',
                'file'
            ])->default('text');
            $table->json('options')->nullable(); // For select/multi-select types
            $table->text('description')->nullable();
            $table->json('validation_rules')->nullable(); // ['required', 'min:3', etc.]
            $table->enum('visibility', ['public', 'private'])->default('private');
            $table->boolean('is_searchable')->default(false);
            $table->integer('order')->default(0); // Display order
            $table->timestamps();

            // Prevent duplicate keys per user
            $table->unique(['user_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_custom_fields');
    }
};
