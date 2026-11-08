<?php

namespace App\Models;

use App\Enums\StockChangeType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientStockLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'ingredient_id',
        'change_type',
        'amount',
        'previous_stock',
        'final_stock',
        'reason',
        'adjusted_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'change_type' => StockChangeType::class,
            'amount' => 'decimal:2',
            'previous_stock' => 'decimal:2',
            'final_stock' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function adjuster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}

