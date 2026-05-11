<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('remote_access_type', 20)->nullable()->after('photo_url'); // vnc, rustdesk, anydesk
            $table->string('remote_access_id', 255)->nullable()->after('remote_access_type');
            $table->timestamp('last_heartbeat')->nullable()->after('notes');
            $table->json('agent_data')->nullable()->after('last_heartbeat');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['remote_access_type', 'remote_access_id', 'last_heartbeat', 'agent_data']);
        });
    }
};
