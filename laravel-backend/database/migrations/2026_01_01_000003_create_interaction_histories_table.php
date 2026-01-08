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
        Schema::create('interaction_histories', function (Blueprint $table) {
            $table->id();

            // User and device context
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('device_serial', 100)->index();
            $table->uuid('session_id')->nullable()->index();

            // App context
            $table->string('package_name', 255)->nullable()->index();
            $table->string('activity_name', 255)->nullable();

            // Node information
            $table->string('node_class', 255)->nullable();
            $table->text('node_text')->nullable();
            $table->text('node_content_desc')->nullable();
            $table->string('node_resource_id', 255)->nullable()->index();
            $table->string('node_bounds', 100)->nullable();
            $table->integer('node_index')->nullable();

            // Node state flags
            $table->boolean('node_checkable')->default(false);
            $table->boolean('node_checked')->default(false);
            $table->boolean('node_clickable')->default(false);
            $table->boolean('node_enabled')->default(true);
            $table->boolean('node_focusable')->default(false);
            $table->boolean('node_focused')->default(false);
            $table->boolean('node_scrollable')->default(false);
            $table->boolean('node_selected')->default(false);

            // Node hierarchy
            $table->text('node_xpath')->nullable();
            $table->json('node_hierarchy')->nullable();

            // Action information
            $table->string('action_type', 50)->default('tap')->index();
            $table->integer('tap_x')->nullable();
            $table->integer('tap_y')->nullable();

            // Additional data
            $table->string('screenshot_path', 500)->nullable();
            $table->json('metadata')->nullable();

            // Sync status
            $table->timestamp('synced_from_controller_at')->nullable();
            $table->string('sync_source', 50)->nullable()->comment('controller, portal-apk');

            $table->timestamps();

            // Indexes for common queries
            $table->index(['device_serial', 'created_at']);
            $table->index(['package_name', 'created_at']);
            $table->index(['session_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interaction_histories');
    }
};
