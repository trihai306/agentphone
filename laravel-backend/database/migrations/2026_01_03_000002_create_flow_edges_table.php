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
        Schema::create('flow_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('flow_id')->nullable()->constrained('flows')->onDelete('cascade');
            $table->string('edge_id')->comment('React Flow edge ID');
            $table->string('source_node_id')->comment('Source node ID');
            $table->string('target_node_id')->comment('Target node ID');
            $table->string('source_handle')->nullable();
            $table->string('target_handle')->nullable();
            $table->string('type')->default('default')->comment('Edge type: default, straight, step, smoothstep, bezier');
            $table->string('label')->nullable();
            $table->boolean('animated')->default(false);
            $table->json('style')->nullable()->comment('Edge styling');
            $table->json('data')->nullable()->comment('Custom edge data');
            $table->timestamps();

            $table->unique(['flow_id', 'edge_id']);
            $table->index(['user_id', 'flow_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flow_edges');
    }
};
