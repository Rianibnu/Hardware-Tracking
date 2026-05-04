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
        Schema::table('consumable_requests', function (Blueprint $table) {
            $table->foreignId('requested_by')->nullable()->change();
            $table->string('public_requester_name')->nullable()->after('requested_by');
            $table->string('public_requester_email')->nullable()->after('public_requester_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consumable_requests', function (Blueprint $table) {
            $table->dropColumn(['public_requester_name', 'public_requester_email']);
            $table->foreignId('requested_by')->nullable(false)->change();
        });
    }
};
