<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing(['diningTable', 'items']);
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('waiter.orders'),
        ];

        $categoryIds = $this->order->items->pluck('category_id')->unique();
        foreach ($categoryIds as $catId) {
            $channels[] = new PrivateChannel('kitchen.category.' . $catId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.status_updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'status' => $this->order->status->value ?? (string)$this->order->status,
            'status_label' => $this->order->status->label(),
            'payment_status' => $this->order->payment_status->value ?? (string)$this->order->payment_status,
            'cancelled_at' => $this->order->cancelled_at?->toIso8601String(),
            'cancel_reason' => $this->order->cancel_reason,
            'updated_at' => now()->toIso8601String(),
        ];
    }
}

