<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductAvailabilityUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Product $product)
    {
        $this->product->loadMissing('category');
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('waiter.orders'),
            new PrivateChannel('kitchen.category.' . $this->product->category_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'product.availability_updated';
    }

    public function broadcastWith(): array
    {
        return [
            'product_id' => $this->product->id,
            'category_id' => $this->product->category_id,
            'name' => $this->product->name,
            'is_available' => (bool)$this->product->is_available,
            'track_stock' => (bool)$this->product->track_stock,
            'stock_quantity' => (int)$this->product->stock_quantity,
            'is_in_stock' => $this->product->isInStock(),
            'updated_at' => now()->toIso8601String(),
        ];
    }
}

