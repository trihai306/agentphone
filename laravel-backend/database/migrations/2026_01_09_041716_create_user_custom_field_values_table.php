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
        Schema::create('user_custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_custom_field_id')->constrained()->cascadeOnDelete();
            $table->text('value')->nullable(); // Store value as text/JSON
            $table->timestamps();

            // One value per field per user
            $table->unique(['user_id', 'user_custom_field_id'], 'user_custom_field_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_custom_field_values');
    }
};
