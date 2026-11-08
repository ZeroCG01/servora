<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Enums\ReminderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CancelOrderAction
{
    /**
     * Cancel an entire order, restore stock for all active items, and log audit history.
     */
    public function execute(Order $order, string $reason, User $user): Order
    {
        if ($order->status === OrderStatus::CANCELLED) {
            throw ValidationException::withMessages([
                'order' => 'Pesanan ini sudah berstatus dibatalkan.',
            ]);
        }

        if ($order->status === OrderStatus::SERVED) {
            throw ValidationException::withMessages([
                'order' => 'Pesanan yang sudah selesai/disajikan tidak dapat dibatalkan secara keseluruhan.',
            ]);
        }

        return DB::transaction(function () use ($order, $reason, $user) {
            $oldOrderStatus = $order->status?->value ?? (string)$order->status;

            // 1. Process each item and restore stock
            foreach ($order->items as $item) {
                if ($item->status !== OrderItemStatus::CANCELLED && $item->status !== OrderItemStatus::SERVED) {
                    $product = $item->product;
                    if ($product && $product->track_stock) {
                        $product->restoreStock($item->quantity);
                    }

                    $item->update([
                        'status' => OrderItemStatus::CANCELLED,
                        'cancelled_at' => now(),
                        'cancel_reason' => $reason,
                    ]);
                }
            }

            // 2. Cancel scheduled order reminder if any
            if ($order->scheduledOrder) {
                $order->scheduledOrder->update([
                    'reminder_status' => ReminderStatus::CANCELLED,
                ]);
            }

            // 3. Mark order cancelled
            $order->update([
                'status' => OrderStatus::CANCELLED,
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'cancel_reason' => $reason,
            ]);

            // 4. Audit log
            $order->statusHistories()->create([
                'from_status' => $oldOrderStatus,
                'to_status' => OrderStatus::CANCELLED->value,
                'changed_by' => $user->id,
                'note' => "Seluruh pesanan dibatalkan. Alasan: {$reason}",
                'created_at' => now(),
            ]);

            $order->load(['items.category', 'items.product', 'diningTable', 'payments', 'scheduledOrder', 'canceller']);

            // Dispatch Real-Time Reverb Event
            event(new \App\Events\OrderStatusUpdated($order));

            return $order;
        });
    }
}

