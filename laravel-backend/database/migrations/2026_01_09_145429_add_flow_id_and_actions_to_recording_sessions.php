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
        Schema::table('recording_sessions', function (Blueprint $table) {
            $table->foreignId('flow_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->json('actions')->nullable()->after('metadata');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recording_sessions', function (Blueprint $table) {
            $table->dropForeign(['flow_id']);
            $table->dropColumn(['flow_id', 'actions']);
        });
    }
};
