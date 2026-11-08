<?php

namespace App\Models;

use App\Enums\StockChangeType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ingredient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'current_stock',
        'unit',
        'minimum_stock',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'current_stock' => 'decimal:2',
            'minimum_stock' => 'decimal:2',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function stockLogs(): HasMany
    {
        return $this->hasMany(IngredientStockLog::class);
    }

    public function isLowStock(): bool
    {
        return (float)$this->current_stock <= (float)$this->minimum_stock;
    }

    public function recordStockChange(
        StockChangeType|string $type,
        float $amount,
        int $adjustedByUserId,
        ?string $reason = null
    ): IngredientStockLog {
        $changeTypeValue = $type instanceof StockChangeType ? $type->value : $type;
        $previousStock = (float)$this->current_stock;

        $finalStock = match ($changeTypeValue) {
            'in' => $previousStock + $amount,
            'out' => max(0, $previousStock - $amount),
            'adjustment' => $amount,
            default => $previousStock,
        };

        $this->update(['current_stock' => $finalStock]);

        return $this->stockLogs()->create([
            'change_type' => $changeTypeValue,
            'amount' => $amount,
            'previous_stock' => $previousStock,
            'final_stock' => $finalStock,
            'reason' => $reason,
            'adjusted_by' => $adjustedByUserId,
            'created_at' => now(),
        ]);
    }
}

