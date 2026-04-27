<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_sheets_configs', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Sync Inventaris Utama"
            $table->string('spreadsheet_id'); // Google Sheets document ID
            $table->string('spreadsheet_url')->nullable(); // Full URL for convenience
            $table->json('sync_sheets'); // Which data types to sync
            $table->boolean('auto_sync')->default(false);
            $table->integer('sync_interval_minutes')->default(30);
            $table->enum('status', ['active', 'paused', 'error'])->default('active');
            $table->text('last_error')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->integer('last_sync_rows')->nullable(); // Total rows synced
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('google_sheets_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('config_id')->constrained('google_sheets_configs')->cascadeOnDelete();
            $table->enum('type', ['manual', 'scheduled', 'webhook']);
            $table->enum('status', ['running', 'success', 'failed']);
            $table->json('sheets_synced')->nullable(); // e.g. ["assets", "tickets"]
            $table->integer('total_rows')->default(0);
            $table->integer('duration_seconds')->nullable();
            $table->text('error_message')->nullable();
            $table->foreignId('triggered_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_sheets_sync_logs');
        Schema::dropIfExists('google_sheets_configs');
    }
};
