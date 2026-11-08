<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Enums\ReminderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrderAction
{
    public function __construct(
        protected GenerateOrderNumberAction $generateOrderNumber,
        protected RecordPaymentAction $recordPayment,
        protected RecalculateOrderStatusAction $recalculateStatus
    ) {}

    /**
     * Create a new order with atomic stock decrement, idempotency check, and optional initial payment.
     */
    public function execute(array $data, User $creator): Order
    {
        // 1. Check Idempotency via client_request_id
        if (!empty($data['client_request_id'])) {
            $existing = Order::with(['items', 'diningTable', 'payments', 'scheduledOrder'])
                ->where('client_request_id', $data['client_request_id'])
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        return DB::transaction(function () use ($data, $creator) {
            $orderType = $data['order_type'] ?? OrderType::DINE_IN->value;
            $isScheduled = !empty($data['scheduled_for']);
            $scheduledFor = $isScheduled ? Carbon::parse($data['scheduled_for']) : null;

            // 2. Validate items & stock
            $itemsData = $data['items'] ?? [];
            if (empty($itemsData)) {
                throw ValidationException::withMessages([
                    'items' => 'Pesanan harus berisi minimal 1 produk menu.',
                ]);
            }

            $productIds = array_column($itemsData, 'product_id');
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            $totalAmount = 0.00;
            $preparedItems = [];

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
                $totalAmount += $subtotal;

                $preparedItems[] = [
                    'product' => $product,
                    'category_id' => $product->category_id,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                    'special_instructions' => $itemInput['special_instructions'] ?? null,
                ];
            }

            // 3. Generate sequential order number
            $orderNumber = $this->generateOrderNumber->execute();

            // 4. Create Order
            $initialStatus = $isScheduled ? OrderStatus::SCHEDULED : OrderStatus::PENDING;

            $order = Order::create([
                'order_number' => $orderNumber,
                'client_request_id' => $data['client_request_id'] ?? null,
                'order_type' => $orderType,
                'dining_table_id' => $orderType === OrderType::DINE_IN->value ? ($data['dining_table_id'] ?? null) : null,
                'customer_name' => $data['customer_name'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => $initialStatus,
                'total_amount' => $totalAmount,
                'paid_amount' => 0.00,
                'payment_status' => PaymentStatus::UNPAID,
                'created_by' => $creator->id,
            ]);

            // 5. Create Order Items & Decrement Stock
            foreach ($preparedItems as $item) {
                /** @var Product $prod */
                $prod = $item['product'];

                // Decrement stock
                $prod->decrementStock($item['quantity']);

                $order->items()->create([
                    'product_id' => $prod->id,
                    'category_id' => $item['category_id'],
                    'product_name' => $item['product_name'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal'],
                    'special_instructions' => $item['special_instructions'],
                    'status' => OrderItemStatus::PENDING,
                    'batch_no' => 1,
                ]);
            }

            // 6. Handle Pre-Order Schedule
            if ($isScheduled && $scheduledFor) {
                // Remind at H-10 minutes
                $remindAt = $scheduledFor->copy()->subMinutes(10);

                $order->scheduledOrder()->create([
                    'scheduled_for' => $scheduledFor,
                    'remind_at' => $remindAt,
                    'reminder_status' => ReminderStatus::WAITING,
                ]);
            }

            // 7. Initial Payment (DP for Pre-Order or Cashier settlement)
            if (!empty($data['payment'])) {
                $pData = $data['payment'];
                $this->recordPayment->execute(
                    $order,
                    $pData['payment_type'] ?? ($isScheduled ? 'down_payment' : 'full'),
                    $pData['payment_method'] ?? 'cash',
                    (float) $pData['amount'],
                    $creator,
                    $pData['notes'] ?? null
                );
            }

            // 8. Log initial history
            $order->statusHistories()->create([
                'from_status' => null,
                'to_status' => $initialStatus->value,
                'changed_by' => $creator->id,
                'note' => $isScheduled ? 'Pesanan Pre-Order dijadwalkan.' : 'Pesanan baru dibuat.',
                'created_at' => now(),
            ]);

            $order->load(['items.category', 'items.product', 'diningTable', 'payments', 'scheduledOrder', 'creator']);

            // 9. Dispatch Real-Time Reverb Event
            event(new \App\Events\NewOrderCreated($order));

            return $order;
        });
    }
}

