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
        Schema::create('marketplace_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Buyer
            $table->foreignId('listing_id')->constrained('marketplace_listings')->onDelete('cascade');

            // Clone reference (ID of the copy in buyer's account)
            $table->string('cloned_type')->nullable();
            $table->unsignedBigInteger('cloned_id')->nullable();

            $table->integer('price_paid')->default(0); // Credits paid
            $table->tinyInteger('rating')->nullable(); // 1-5
            $table->text('review')->nullable();

            $table->timestamps();

            // Each user can only purchase a listing once
            $table->unique(['user_id', 'listing_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_purchases');
    }
};
