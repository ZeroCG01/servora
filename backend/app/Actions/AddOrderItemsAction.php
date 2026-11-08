<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddOrderItemsAction
{
    public function __construct(
        protected RecalculateOrderStatusAction $recalculateStatus
    ) {}

    /**
     * Append additional items (new batch) to an active order.
     */
    public function execute(Order $order, array $itemsData, User $user): Order
    {
        if (in_array($order->status, [OrderStatus::SERVED, OrderStatus::CANCELLED])) {
            throw ValidationException::withMessages([
                'order' => 'Tidak dapat menambahkan item ke pesanan yang sudah selesai atau dibatalkan.',
            ]);
        }

        if (empty($itemsData)) {
            throw ValidationException::withMessages([
                'items' => 'Daftar item tambahan tidak boleh kosong.',
            ]);
        }

        return DB::transaction(function () use ($order, $itemsData, $user) {
            $nextBatchNo = ($order->items()->max('batch_no') ?? 1) + 1;

            $productIds = array_column($itemsData, 'product_id');
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            $additionalTotal = 0.00;
            $newItems = [];

            foreach ($itemsData as $index => $itemInput) {
                $productId = $itemInput['product_id'];
                $product = $products->get($productId);

                if (!$product || !$product->is_active) {
                    throw ValidationException::withMessages([
                        "items.{$index}.product_id" => "Produk ID {$productId} tidak ditemukan atau tidak aktif.",
                    ]);
                }

                if (!$product->is_available) {
                    throw ValidationException::withMessages([
                        "items.{$index}.product_id" => "Produk {$product->name} saat ini sedang habis (sold out).",
                    ]);
                }

                $quantity = (int) $itemInput['quantity'];
                if ($quantity <= 0) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => "Jumlah kuantitas untuk {$product->name} harus lebih dari 0.",
                    ]);
                }

                // Portion stock check
                if ($product->track_stock && $product->stock_quantity < $quantity) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => "Stok porsi {$product->name} tidak mencukupi (tersisa {$product->stock_quantity} porsi).",
                    ]);
                }

                $unitPrice = (float) $product->price;
                $subtotal = $unitPrice * $quantity;
                $additionalTotal += $subtotal;

                // Decrement portion stock
                $product->decrementStock($quantity);

                $createdItem = $order->items()->create([
                    'product_id' => $product->id,
                    'category_id' => $product->category_id,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                    'special_instructions' => $itemInput['special_instructions'] ?? null,
                    'status' => OrderItemStatus::PENDING,
                    'batch_no' => $nextBatchNo,
                ]);

                $newItems[] = $createdItem;
            }

            // Update order total amount
            $order->increment('total_amount', $additionalTotal);

            // Re-evaluate payment status if partially paid
            if ($order->paid_amount < $order->total_amount && $order->paid_amount > 0) {
                $order->update(['payment_status' => \App\Enums\PaymentStatus::PARTIALLY_PAID]);
            }

            // Recalculate order aggregate status
            $this->recalculateStatus->execute($order);

            $order->statusHistories()->create([
                'from_status' => $order->status->value,
                'to_status' => $order->status->value,
                'changed_by' => $user->id,
                'note' => "Penambahan menu pesanan (Batch #{$nextBatchNo}).",
                'created_at' => now(),
            ]);

            $order->load(['items.category', 'items.product', 'diningTable', 'payments', 'scheduledOrder']);

            // Dispatch Real-Time Reverb Event
            event(new \App\Events\OrderItemsAdded($order, $newItems, $nextBatchNo));

            return $order;
        });
    }
}

