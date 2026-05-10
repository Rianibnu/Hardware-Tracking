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
        Schema::table('assets', function (Blueprint $table) {
            $table->string('ram_capacity')->nullable()->after('ip_address');
            $table->string('windows_license')->nullable()->after('ram_capacity');
            $table->string('office_license')->nullable()->after('windows_license');
            $table->string('pic')->nullable()->after('office_license');
            $table->string('photo_url')->nullable()->after('pic');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['ram_capacity', 'windows_license', 'office_license', 'pic', 'photo_url']);
        });
    }
};
