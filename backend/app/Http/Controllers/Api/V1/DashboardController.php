<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ScheduledOrder;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Operational Dashboard Overview for Manager & Staff.
     */
    public function overview(Request $request): JsonResponse
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();

        // 1. Today's Financials
        $todayRevenue = (float) Payment::whereBetween('paid_at', [$todayStart, $todayEnd])
            ->sum('amount') - (float) Payment::whereBetween('paid_at', [$todayStart, $todayEnd])->sum('change_amount');

        $todayOrdersQuery = Order::whereBetween('created_at', [$todayStart, $todayEnd])
            ->where('status', '!=', OrderStatus::CANCELLED);

        $todayTotalOrders = (int) $todayOrdersQuery->count();
        $todayPaidOrders = (int) (clone $todayOrdersQuery)->where('payment_status', PaymentStatus::PAID)->count();

        // 2. Active Kitchen Load (Items currently cooking or pending)
        $activeItems = OrderItem::whereHas('order', function ($q) {
            $q->whereIn('status', [OrderStatus::PENDING, OrderStatus::IN_PROGRESS, OrderStatus::READY]);
        })->whereIn('status', [OrderItemStatus::PENDING, OrderItemStatus::ON_PROGRESS]);

        $totalActiveKitchenItems = (int) (clone $activeItems)->count();

        // Load breakdown by the 3 kitchen stations
        $stationLoads = Category::all()->map(function ($cat) {
            $count = OrderItem::where('category_id', $cat->id)
                ->whereHas('order', function ($q) {
                    $q->whereIn('status', [OrderStatus::PENDING, OrderStatus::IN_PROGRESS, OrderStatus::READY]);
                })
                ->whereIn('status', [OrderItemStatus::PENDING, OrderItemStatus::ON_PROGRESS])
                ->count();

            return [
                'category_id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'active_items_count' => $count,
            ];
        });

        // 3. Upcoming Pre-Orders Today
        $upcomingPreOrders = ScheduledOrder::with(['order.items.category', 'order.diningTable'])
            ->whereHas('order', fn($q) => $q->where('status', OrderStatus::SCHEDULED))
            ->whereBetween('scheduled_for', [Carbon::now(), $todayEnd])
            ->orderBy('scheduled_for')
            ->limit(5)
            ->get();

        // 4. Stock & Inventory Alerts
        $soldOutProductsCount = Product::where('is_available', false)->count();
        $lowPortionProducts = Product::where('is_active', true)
            ->where('track_stock', true)
            ->where('stock_quantity', '<=', 5)
            ->where('stock_quantity', '>', 0)
            ->count();

        $lowIngredientsCount = Ingredient::whereColumn('current_stock', '<=', 'minimum_stock')->count();

        return $this->successResponse([
            'today' => [
                'date' => Carbon::today()->toDateString(),
                'revenue' => $todayRevenue,
                'total_orders' => $todayTotalOrders,
                'paid_orders' => $todayPaidOrders,
            ],
            'kitchen_load' => [
                'total_active_items' => $totalActiveKitchenItems,
                'station_loads' => $stationLoads,
            ],
            'upcoming_preorders_count' => $upcomingPreOrders->count(),
            'upcoming_preorders' => $upcomingPreOrders,
            'alerts' => [
                'sold_out_products_count' => $soldOutProductsCount,
                'low_portion_products_count' => $lowPortionProducts,
                'low_ingredients_count' => $lowIngredientsCount,
            ],
        ], 'Ringkasan dashboard operasional berhasil diambil.');
    }
}

