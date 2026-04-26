<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained()->nullOnDelete();
            $table->string('vendor_name');
            $table->text('service_description');
            $table->date('estimated_completion_date')->nullable();
            $table->decimal('cost', 15, 2)->nullable();
            $table->string('status')->default('in_progress'); // in_progress, completed, cancelled
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('completed_by')->nullable()->constrained('users');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_records');
    }
};
