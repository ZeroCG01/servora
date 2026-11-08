<?php

namespace App\Events;

use App\Http\Resources\OrderItemResource;
use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing(['items.category', 'items.product', 'diningTable', 'scheduledOrder']);
    }

    /**
     * Channels to broadcast on: Waiter and relevant Kitchen category stations.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('waiter.orders'),
        ];

        // Broadcast only to kitchen stations that have items in this order
        $categoryIds = $this->order->items->pluck('category_id')->unique();
        foreach ($categoryIds as $catId) {
            $channels[] = new PrivateChannel('kitchen.category.' . $catId);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order.created';
    }

    /**
     * Get the data that should be broadcasted.
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order_number,
            'order_type' => $this->order->order_type->value ?? (string)$this->order->order_type,
            'order_type_label' => $this->order->order_type->label(),
            'dining_table' => $this->order->diningTable ? [
                'id' => $this->order->diningTable->id,
                'number' => $this->order->diningTable->number,
                'area' => $this->order->diningTable->area,
            ] : null,
            'customer_name' => $this->order->customer_name,
            'notes' => $this->order->notes,
            'status' => $this->order->status->value ?? (string)$this->order->status,
            'status_label' => $this->order->status->label(),
            'total_amount' => (float)$this->order->total_amount,
            'payment_status' => $this->order->payment_status->value ?? (string)$this->order->payment_status,
            'items' => OrderItemResource::collection($this->order->items)->resolve(),
            'created_at' => $this->order->created_at?->toIso8601String(),
        ];
    }
}

