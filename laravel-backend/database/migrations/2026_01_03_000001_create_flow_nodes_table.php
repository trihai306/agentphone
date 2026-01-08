<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('flow_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('flow_id')->nullable()->constrained('flows')->onDelete('cascade');
            $table->string('node_id')->comment('React Flow node ID');
            $table->string('type')->default('default')->comment('Node type: default, input, output, custom');
            $table->string('label')->nullable();
            $table->float('position_x')->default(0);
            $table->float('position_y')->default(0);
            $table->json('data')->nullable()->comment('Custom node data');
            $table->json('style')->nullable()->comment('Node styling');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['flow_id', 'node_id']);
            $table->index(['user_id', 'flow_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flow_nodes');
    }
};
