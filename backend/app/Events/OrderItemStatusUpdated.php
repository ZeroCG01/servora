<?php

namespace App\Events;

use App\Models\OrderItem;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderItemStatusUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public OrderItem $item)
    {
        $this->item->loadMissing(['order.diningTable', 'category']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('waiter.orders'),
            new PrivateChannel('kitchen.category.' . $this->item->category_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'item.status_updated';
    }

    public function broadcastWith(): array
    {
        return [
            'item_id' => $this->item->id,
            'order_id' => $this->item->order_id,
            'order_number' => $this->item->order?->order_number,
            'dining_table' => $this->item->order?->diningTable ? [
                'id' => $this->item->order->diningTable->id,
                'number' => $this->item->order->diningTable->number,
            ] : null,
            'category_id' => $this->item->category_id,
            'category_name' => $this->item->category?->name,
            'product_name' => $this->item->product_name,
            'quantity' => (int)$this->item->quantity,
            'special_instructions' => $this->item->special_instructions,
            'status' => $this->item->status->value ?? (string)$this->item->status,
            'status_label' => $this->item->status->label(),
            'started_at' => $this->item->started_at?->toIso8601String(),
            'ready_at' => $this->item->ready_at?->toIso8601String(),
            'served_at' => $this->item->served_at?->toIso8601String(),
            'order_aggregate_status' => $this->item->order?->status->value,
            'updated_at' => now()->toIso8601String(),
        ];
    }
}

