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

class PreOrderReminderDispatched implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing(['items.category', 'scheduledOrder', 'diningTable']);
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
        return 'preorder.alarm';
    }

    public function broadcastWith(): array
    {
        $scheduledFor = $this->order->scheduledOrder?->scheduled_for;
        $timeStr = $scheduledFor ? $scheduledFor->format('H:i') : '';

        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'customer_name' => $this->order->customer_name,
            'order_type' => $this->order->order_type->value ?? (string)$this->order->order_type,
            'scheduled_for' => $scheduledFor?->toIso8601String(),
            'scheduled_time' => $timeStr,
            'lead_minutes' => 10,
            'alert_message' => "ALARM PRE-ORDER: Pesanan #{$this->order->order_number} harus siap pada pukul {$timeStr} WIB!",
            'items' => OrderItemResource::collection($this->order->items)->resolve(),
            'dispatched_at' => now()->toIso8601String(),
        ];
    }
}

