<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CancelOrderItemAction
{
    public function __construct(
        protected RecalculateOrderStatusAction $recalculateStatus
    ) {}

    /**
     * Cancel an individual order item and restore portion stock.
     */
    public function execute(Order $order, OrderItem $item, string $reason, User $user): Order
    {
        if ($item->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'item' => 'Item menu tidak ditemukan pada pesanan ini.',
            ]);
        }

        if ($item->status === OrderItemStatus::CANCELLED) {
            throw ValidationException::withMessages([
                'item' => 'Item menu ini sudah dalam status dibatalkan.',
            ]);
        }

        if ($item->status === OrderItemStatus::SERVED) {
            throw ValidationException::withMessages([
                'item' => 'Item menu yang sudah disajikan tidak dapat dibatalkan.',
            ]);
        }

        return DB::transaction(function () use ($order, $item, $reason, $user) {
            $oldStatus = $item->status?->value ?? (string)$item->status;

            // 1. Restore product portion stock if tracked
            $product = $item->product;
            if ($product && $product->track_stock) {
                $product->restoreStock($item->quantity);
            }

            // 2. Mark item cancelled
            $item->update([
                'status' => OrderItemStatus::CANCELLED,
                'cancelled_at' => now(),
                'cancel_reason' => $reason,
            ]);

            // 3. Deduct total amount
            $order->decrement('total_amount', (float)$item->subtotal);

            // Re-evaluate payment status
            if ($order->paid_amount >= $order->total_amount && $order->total_amount > 0) {
                $order->update(['payment_status' => \App\Enums\PaymentStatus::PAID]);
            }

            // 4. Recalculate order status
            $this->recalculateStatus->execute($order);

            // 5. History log
            $order->statusHistories()->create([
                'order_item_id' => $item->id,
                'from_status' => $oldStatus,
                'to_status' => OrderItemStatus::CANCELLED->value,
                'changed_by' => $user->id,
                'note' => "Item '{$item->product_name}' dibatalkan. Alasan: {$reason}",
                'created_at' => now(),
            ]);

            return $order->load(['items.category', 'items.product', 'diningTable', 'payments', 'scheduledOrder']);
        });
    }
}

