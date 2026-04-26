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
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('reported_by')->nullable()->change();
            $table->string('reporter_name')->nullable()->after('reported_by');
        });

        Schema::table('ticket_logs', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->change();
        });

        Schema::table('asset_logs', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('reported_by')->nullable(false)->change();
            $table->dropColumn('reporter_name');
        });

        Schema::table('ticket_logs', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable(false)->change();
        });

        Schema::table('asset_logs', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable(false)->change();
        });
    }
};
