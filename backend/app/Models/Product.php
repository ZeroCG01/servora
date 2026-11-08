<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'image_path',
        'is_available',
        'is_active',
        'track_stock',
        'stock_quantity',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_available' => 'boolean',
            'is_active' => 'boolean',
            'track_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isInStock(): bool
    {
        if (!$this->is_active || !$this->is_available) {
            return false;
        }

        if ($this->track_stock && $this->stock_quantity <= 0) {
            return false;
        }

        return true;
    }

    public function decrementStock(int $quantity): void
    {
        if ($this->track_stock) {
            $this->decrement('stock_quantity', $quantity);
            if ($this->fresh()->stock_quantity <= 0) {
                $this->update(['is_available' => false]);
            }
        }
    }

    public function restoreStock(int $quantity): void
    {
        if ($this->track_stock) {
            $this->increment('stock_quantity', $quantity);
            if ($this->fresh()->stock_quantity > 0) {
                $this->update(['is_available' => true]);
            }
        }
    }
}

