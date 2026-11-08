<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\RecalculateOrderStatusAction;
use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Events\OrderItemStatusUpdated;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Kitchen\UpdateKitchenItemStatusRequest;
use App\Http\Resources\OrderItemResource;
use App\Http\Resources\OrderResource;
use App\Models\OrderItem;
use App\Models\ScheduledOrder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KitchenController extends Controller
{
    public function __construct(
        protected RecalculateOrderStatusAction $recalculateStatus
    ) {}

    /**
     * Get active kitchen orders and items structured for 3-Column Kanban:
     * - Pending (Menunggu)
     * - On Progress (Sedang Dimasak)
     * - Ready (Siap Disajikan)
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = OrderItem::with(['order.diningTable', 'category', 'product'])
            ->whereHas('order', function ($q) {
                // Do not show cancelled or served orders, or un-dispatched pre-orders
                $q->whereIn('status', [OrderStatus::PENDING, OrderStatus::IN_PROGRESS, OrderStatus::READY]);
            })
            ->whereIn('status', [
                OrderItemStatus::PENDING,
                OrderItemStatus::ON_PROGRESS,
                OrderItemStatus::READY,
            ]);

        // Station filtering based on Kitchen User's assigned categories
        if ($user->isKitchen()) {
            $assignedCategoryIds = $user->categories()->pluck('categories.id')->toArray();
            $query->whereIn('category_id', $assignedCategoryIds);
        } elseif ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        $items = $query->orderBy('created_at')->get();

        // Grouping into 3 Kanban columns
        $kanban = [
            'pending' => OrderItemResource::collection($items->where('status', OrderItemStatus::PENDING)->values()),
            'on_progress' => OrderItemResource::collection($items->where('status', OrderItemStatus::ON_PROGRESS)->values()),
            'ready' => OrderItemResource::collection($items->where('status', OrderItemStatus::READY)->values()),
        ];

        return $this->successResponse($kanban, 'Daftar tiket antrean dapur berhasil diambil.');
    }

    /**
     * Get upcoming pre-orders assigned to this station.
     */
    public function scheduled(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = ScheduledOrder::with(['order.items.category', 'order.diningTable'])
            ->whereHas('order', function ($q) {
                $q->where('status', OrderStatus::SCHEDULED);
            })
            ->where('scheduled_for', '>=', Carbon::now());

        if ($user->isKitchen()) {
            $assignedCategoryIds = $user->categories()->pluck('categories.id')->toArray();
            $query->whereHas('order.items', function ($q) use ($assignedCategoryIds) {
                $q->whereIn('category_id', $assignedCategoryIds);
            });
        }

        $scheduledOrders = $query->orderBy('scheduled_for')->get();

        return $this->successResponse($scheduledOrders, 'Daftar Pre-Order terjadwal berhasil diambil.');
    }

    /**
     * Update the cooking status of a specific order item.
     */
    public function updateItemStatus(UpdateKitchenItemStatusRequest $request, OrderItem $item): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Station permission check
        if ($user->isKitchen()) {
            $isAssigned = $user->categories()->where('categories.id', $item->category_id)->exists();
            if (!$isAssigned) {
                return $this->errorResponse(
                    'Akses ditolak. Anda hanya dapat memperbarui tiket pesanan dari stasiun dapur yang ditugaskan kepada Anda.',
                    403
                );
            }
        }

        $newStatus = OrderItemStatus::from($request->validated()['status']);
        $oldStatus = $item->status;

        if ($oldStatus === $newStatus) {
            return $this->successResponse(new OrderItemResource($item), 'Status item tidak berubah.');
        }

        return DB::transaction(function () use ($item, $newStatus, $oldStatus, $user) {
            $order = $item->order;
            $oldOrderStatus = $order->status;

            $updateData = ['status' => $newStatus];

            // Set timestamps accordingly
            if ($newStatus === OrderItemStatus::ON_PROGRESS && !$item->started_at) {
                $updateData['started_at'] = now();
            } elseif ($newStatus === OrderItemStatus::READY && !$item->ready_at) {
                $updateData['ready_at'] = now();
            } elseif ($newStatus === OrderItemStatus::SERVED && !$item->served_at) {
                $updateData['served_at'] = now();
            }

            $item->update($updateData);

            // Audit history
            $order->statusHistories()->create([
                'order_item_id' => $item->id,
                'from_status' => $oldStatus->value,
                'to_status' => $newStatus->value,
                'changed_by' => $user->id,
                'note' => "Status menu '{$item->product_name}' diubah menjadi {$newStatus->label()}.",
                'created_at' => now(),
            ]);

            // Recalculate order aggregate status
            $this->recalculateStatus->execute($order);
            $order->refresh();

            $item->load(['order.diningTable', 'category', 'product']);

            // 1. Dispatch Item Status Event
            event(new OrderItemStatusUpdated($item));

            // 2. Dispatch Order Status Event if aggregate changed
            if ($order->status !== $oldOrderStatus) {
                event(new OrderStatusUpdated($order));
            }

            return $this->successResponse([
                'item' => new OrderItemResource($item),
                'order' => new OrderResource($order->load(['diningTable', 'items'])),
            ], "Status menu berhasil diubah menjadi {$newStatus->label()}.");
        });
    }
}

