<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\AddOrderItemsAction;
use App\Actions\CancelOrderAction;
use App\Actions\CancelOrderItemAction;
use App\Actions\CreateOrderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\AddItemsRequest;
use App\Http\Requests\Order\CancelOrderItemRequest;
use App\Http\Requests\Order\CancelOrderRequest;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Display a listing of orders (Default active window: last 3 days).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with([
            'items.category',
            'items.product',
            'diningTable',
            'payments',
            'scheduledOrder',
            'creator',
        ]);

        // Status Filter
        if ($request->filled('status')) {
            $statuses = explode(',', $request->input('status'));
            $query->whereIn('status', $statuses);
        }

        // Payment Status Filter
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        // Order Type Filter
        if ($request->filled('order_type')) {
            $query->where('order_type', $request->input('order_type'));
        }

        // Table Filter
        if ($request->filled('dining_table_id')) {
            $query->where('dining_table_id', $request->input('dining_table_id'));
        }

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        // Date Range Filter (Default 3 days as per UMKM specification)
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->input('start_date'))->startOfDay(),
                Carbon::parse($request->input('end_date'))->endOfDay(),
            ]);
        } elseif (!$request->boolean('all_history')) {
            $days = (int) $request->input('days', 3);
            $query->where('created_at', '>=', Carbon::now()->subDays($days)->startOfDay());
        }

        $orders = $query->orderByDesc('id')->get();

        return $this->successResponse(OrderResource::collection($orders), 'Daftar pesanan berhasil diambil.');
    }

    /**
     * Create a new order (Supports Dine-in, Takeaway, Pre-Order, and immediate payment/DP).
     */
    public function store(StoreOrderRequest $request, CreateOrderAction $action): JsonResponse
    {
        $order = $action->execute($request->validated(), $request->user());

        return $this->successResponse(new OrderResource($order), 'Pesanan berhasil dibuat.', 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        $order->load([
            'items.category',
            'items.product',
            'diningTable',
            'payments.receiver',
            'scheduledOrder',
            'statusHistories.changer',
            'creator',
            'canceller',
        ]);

        return $this->successResponse(new OrderResource($order), 'Detail pesanan berhasil diambil.');
    }

    /**
     * Append additional items to an active order.
     */
    public function addItems(AddItemsRequest $request, Order $order, AddOrderItemsAction $action): JsonResponse
    {
        $updatedOrder = $action->execute($order, $request->validated()['items'], $request->user());

        return $this->successResponse(new OrderResource($updatedOrder), 'Menu tambahan berhasil ditambahkan ke pesanan.');
    }

    /**
     * Cancel an entire order.
     */
    public function cancel(CancelOrderRequest $request, Order $order, CancelOrderAction $action): JsonResponse
    {
        $cancelledOrder = $action->execute($order, $request->validated()['reason'], $request->user());

        return $this->successResponse(new OrderResource($cancelledOrder), 'Pesanan berhasil dibatalkan.');
    }

    /**
     * Cancel a specific order item.
     */
    public function cancelItem(
        CancelOrderItemRequest $request,
        Order $order,
        OrderItem $item,
        CancelOrderItemAction $action
    ): JsonResponse {
        $updatedOrder = $action->execute($order, $item, $request->validated()['reason'], $request->user());

        return $this->successResponse(new OrderResource($updatedOrder), 'Item menu pesanan berhasil dibatalkan.');
    }
}

