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
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name', 150);
            $table->decimal('current_stock', 10, 2)->default(0);
            $table->string('unit', 30);
            $table->decimal('minimum_stock', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['category_id', 'current_stock']);
        });

        Schema::create('ingredient_stock_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->string('change_type', 20); // in, out, adjustment
            $table->decimal('amount', 10, 2);
            $table->decimal('previous_stock', 10, 2);
            $table->decimal('final_stock', 10, 2);
            $table->text('reason')->nullable();
            $table->foreignId('adjusted_by')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['ingredient_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_logs');
        Schema::dropIfExists('ingredients');
    }
};

