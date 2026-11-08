<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;

class RecalculateOrderStatusAction
{
    /**
     * Recalculate order aggregate status based on its items' statuses and payment.
     */
    public function execute(Order $order): OrderStatus
    {
        // If already cancelled, do not alter
        if ($order->status === OrderStatus::CANCELLED) {
            return OrderStatus::CANCELLED;
        }

        // If scheduled pre-order and not yet transitioned to pending/in_progress
        if ($order->status === OrderStatus::SCHEDULED && $order->scheduledOrder) {
            return OrderStatus::SCHEDULED;
        }

        $items = $order->items()->get();

        if ($items->isEmpty()) {
            return $order->status;
        }

        $totalItems = $items->count();
        $cancelledItems = $items->where('status', OrderItemStatus::CANCELLED)->count();

        // 1. If ALL items are cancelled -> order cancelled
        if ($cancelledItems === $totalItems) {
            $order->update(['status' => OrderStatus::CANCELLED]);
            return OrderStatus::CANCELLED;
        }

        $activeItems = $items->where('status', '!=', OrderItemStatus::CANCELLED);
        $activeCount = $activeItems->count();

        $servedCount = $activeItems->where('status', OrderItemStatus::SERVED)->count();
        $readyCount = $activeItems->where('status', OrderItemStatus::READY)->count();
        $onProgressCount = $activeItems->where('status', OrderItemStatus::ON_PROGRESS)->count();
        $pendingCount = $activeItems->where('status', OrderItemStatus::PENDING)->count();

        // 2. If ALL active items are SERVED -> order served
        if ($servedCount === $activeCount) {
            $newStatus = OrderStatus::SERVED;
        }
        // 3. If ALL active items are READY -> order ready
        elseif ($readyCount === $activeCount) {
            $newStatus = OrderStatus::READY;
        }
        // 4. If ANY item is ON_PROGRESS or READY -> order in_progress
        elseif ($onProgressCount > 0 || $readyCount > 0 || $servedCount > 0) {
            $newStatus = OrderStatus::IN_PROGRESS;
        }
        // 5. If ALL active items are PENDING -> order pending
        else {
            $newStatus = OrderStatus::PENDING;
        }

        if ($order->status !== $newStatus) {
            $oldStatus = $order->status?->value ?? (string)$order->status;
            $order->update(['status' => $newStatus]);

            $order->statusHistories()->create([
                'from_status' => $oldStatus,
                'to_status' => $newStatus->value,
                'note' => 'Otomatis diperbarui oleh sistem kalkulasi status pesanan.',
                'created_at' => now(),
            ]);
        }

        return $newStatus;
    }
}

