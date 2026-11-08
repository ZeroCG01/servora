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
        Schema::create('scheduled_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->dateTime('scheduled_for');
            $table->dateTime('remind_at');
            $table->string('reminder_status', 20)->default('waiting')->index();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamps();

            $table->index(['reminder_status', 'remind_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_orders');
    }
};

