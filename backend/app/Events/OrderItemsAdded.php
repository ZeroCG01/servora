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

class OrderItemsAdded implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param Order $order
     * @param array $newItems
     * @param int $batchNo
     */
    public function __construct(
        public Order $order,
        public array $newItems,
        public int $batchNo
    ) {
        $this->order->loadMissing(['diningTable']);
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('waiter.orders'),
        ];

        $categoryIds = collect($this->newItems)->pluck('category_id')->unique();
        foreach ($categoryIds as $catId) {
            $channels[] = new PrivateChannel('kitchen.category.' . $catId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.items_added';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'dining_table' => $this->order->diningTable ? [
                'id' => $this->order->diningTable->id,
                'number' => $this->order->diningTable->number,
            ] : null,
            'customer_name' => $this->order->customer_name,
            'batch_no' => $this->batchNo,
            'total_amount' => (float)$this->order->total_amount,
            'new_items' => OrderItemResource::collection($this->newItems)->resolve(),
            'updated_at' => now()->toIso8601String(),
        ];
    }
}

