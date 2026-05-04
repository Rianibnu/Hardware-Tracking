<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('consumable_transactions')) return;
        Schema::create('consumable_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consumable_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['in', 'out']); // in = stok masuk, out = distribusi
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2)->nullable(); // for stock in
            $table->string('supplier')->nullable(); // for stock in
            $table->foreignId('request_id')->nullable()->constrained('consumable_requests')->nullOnDelete();
            $table->foreignId('distributed_to')->nullable()->constrained('users')->nullOnDelete(); // recipient
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete(); // destination
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consumable_transactions');
    }
};
