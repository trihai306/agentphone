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
        Schema::create('data_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_collection_id')->constrained()->onDelete('cascade');
            $table->json('data'); // Flexible schema - stores all field values
            $table->string('status')->default('active'); // active, archived
            $table->timestamps();

            // Indexes for performance
            $table->index('data_collection_id');
            $table->index(['data_collection_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_records');
    }
};
