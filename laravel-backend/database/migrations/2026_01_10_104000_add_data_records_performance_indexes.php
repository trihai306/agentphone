<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * Adds performance indexes for handling millions of records
     */
    public function up(): void
    {
        Schema::table('data_records', function (Blueprint $table) {
            // Composite index for cursor pagination (most important!)
            // Enables O(1) pagination: WHERE data_collection_id = ? AND id > ? ORDER BY id
            $table->index(['data_collection_id', 'id'], 'idx_cursor_pagination');

            // Composite index for date-based sorting
            // Enables: WHERE data_collection_id = ? ORDER BY created_at DESC
            $table->index(['data_collection_id', 'created_at'], 'idx_date_sorting');

            // Soft delete support for archiving
            $table->softDeletes();

            // Index for filtering deleted records
            $table->index(['data_collection_id', 'status', 'deleted_at'], 'idx_active_records');
        });

        // Add fulltext search capability for MySQL 8+
        // This creates a virtual column from JSON for faster text search
        if (DB::connection()->getDriverName() === 'mysql') {
            // Check MySQL version supports generated columns
            try {
                DB::statement("
                    ALTER TABLE data_records 
                    ADD COLUMN search_text TEXT 
                    GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$'))) VIRTUAL
                ");
                DB::statement("ALTER TABLE data_records ADD FULLTEXT INDEX idx_fulltext_search (search_text)");
            } catch (\Exception $e) {
                // Silently ignore if MySQL version doesn't support this
                \Log::warning('Could not create generated column for fulltext search: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_records', function (Blueprint $table) {
            $table->dropIndex('idx_cursor_pagination');
            $table->dropIndex('idx_date_sorting');
            $table->dropIndex('idx_active_records');
            $table->dropSoftDeletes();
        });

        // Drop generated column if exists
        if (DB::connection()->getDriverName() === 'mysql') {
            try {
                DB::statement("ALTER TABLE data_records DROP INDEX idx_fulltext_search");
                DB::statement("ALTER TABLE data_records DROP COLUMN search_text");
            } catch (\Exception $e) {
                // Ignore if doesn't exist
            }
        }
    }
};
