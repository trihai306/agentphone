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
        Schema::create('marketplace_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Seller

            // Polymorphic: DataCollection or Flow
            $table->string('listable_type');
            $table->unsignedBigInteger('listable_id');

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->json('tags')->nullable();

            // Pricing
            $table->enum('price_type', ['free', 'paid'])->default('free');
            $table->integer('price')->default(0); // Credits

            // Stats
            $table->integer('downloads_count')->default(0);
            $table->integer('views_count')->default(0);
            $table->decimal('rating', 2, 1)->default(0);
            $table->integer('ratings_count')->default(0);

            // Status
            $table->enum('status', ['draft', 'pending', 'published', 'rejected'])->default('draft');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['listable_type', 'listable_id']);
            $table->index(['status', 'published_at']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_listings');
    }
};
