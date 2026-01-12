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
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('email');
            $table->string('phone')->nullable()->after('avatar');
            $table->text('bio')->nullable()->after('phone');
            $table->string('location')->nullable()->after('bio');
            $table->string('timezone')->default('Asia/Ho_Chi_Minh')->after('location');
            $table->string('language')->default('vi')->after('timezone');
            $table->json('social_links')->nullable()->after('language');
            $table->json('preferences')->nullable()->after('social_links');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar',
                'phone',
                'bio',
                'location',
                'timezone',
                'language',
                'social_links',
                'preferences',
            ]);
        });
    }
};
