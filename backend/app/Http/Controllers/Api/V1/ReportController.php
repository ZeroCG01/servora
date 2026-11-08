<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Parse date range with default 3-day window as per UMKM specification (Q-13).
     */
    protected function getDateRange(Request $request): array
    {
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
            $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
        } else {
            $days = (int) $request->input('days', 3);
            $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
            $endDate = Carbon::now()->endOfDay();
        }

        return [$startDate, $endDate];
    }

    /**
     * Sales & revenue summary.
     */
    public function summary(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        // 1. Total revenue received from payments in range
        $totalRevenue = (float) Payment::whereBetween('paid_at', [$startDate, $endDate])
            ->sum('amount') - (float) Payment::whereBetween('paid_at', [$startDate, $endDate])->sum('change_amount');

        // 2. Orders in range (excluding cancelled)
        $ordersQuery = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', OrderStatus::CANCELLED);

        $totalOrdersCount = (int) $ordersQuery->count();
        $paidOrdersCount = (int) (clone $ordersQuery)->where('payment_status', PaymentStatus::PAID)->count();

        // 3. Total items sold
        $totalItemsSold = (int) OrderItem::whereHas('order', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate])
              ->where('status', '!=', OrderStatus::CANCELLED);
        })->where('status', '!=', OrderItemStatus::CANCELLED)->sum('quantity');

        // 4. Payment method breakdown
        $paymentMethods = Payment::whereBetween('paid_at', [$startDate, $endDate])
            ->selectRaw('payment_method, SUM(amount - change_amount) as total_amount, COUNT(id) as total_transactions')
            ->groupBy('payment_method')
            ->get()
            ->map(fn($p) => [
                'method' => $p->payment_method->value ?? (string)$p->payment_method,
                'method_label' => $p->payment_method->label(),
                'total_amount' => (float)$p->total_amount,
                'total_transactions' => (int)$p->total_transactions,
            ]);

        // 5. Order Type breakdown (Dine-in vs Takeaway)
        $orderTypes = (clone $ordersQuery)
            ->selectRaw('order_type, SUM(total_amount) as total_amount, COUNT(id) as total_orders')
            ->groupBy('order_type')
            ->get()
            ->map(fn($o) => [
                'order_type' => $o->order_type->value ?? (string)$o->order_type,
                'order_type_label' => $o->order_type->label(),
                'total_amount' => (float)$o->total_amount,
                'total_orders' => (int)$o->total_orders,
            ]);

        return $this->successResponse([
            'date_range' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'total_revenue' => $totalRevenue,
            'total_orders_count' => $totalOrdersCount,
            'paid_orders_count' => $paidOrdersCount,
            'total_items_sold' => $totalItemsSold,
            'payment_methods' => $paymentMethods,
            'order_types' => $orderTypes,
        ], 'Ringkasan laporan penjualan berhasil diambil.');
    }

    /**
     * Top selling products in date range.
     */
    public function topProducts(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        $limit = (int) $request->input('limit', 5);

        $top = OrderItem::whereHas('order', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate])
              ->where('status', '!=', OrderStatus::CANCELLED);
        })
        ->where('status', '!=', OrderItemStatus::CANCELLED)
        ->selectRaw('product_name, category_id, SUM(quantity) as total_sold, SUM(subtotal) as total_revenue')
        ->groupBy('product_name', 'category_id')
        ->orderByDesc('total_sold')
        ->limit($limit)
        ->get();

        return $this->successResponse($top, 'Daftar produk terlaris berhasil diambil.');
    }

    /**
     * Category revenue distribution across 3 stations.
     */
    public function categorySales(Request $request): JsonResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $sales = Category::withCount(['orderItems as total_sold' => function ($q) use ($startDate, $endDate) {
            $q->whereHas('order', function ($oq) use ($startDate, $endDate) {
                $oq->whereBetween('created_at', [$startDate, $endDate])
                   ->where('status', '!=', OrderStatus::CANCELLED);
            })->where('status', '!=', OrderItemStatus::CANCELLED);
        }])
        ->get()
        ->map(function ($cat) use ($startDate, $endDate) {
            $revenue = (float) OrderItem::where('category_id', $cat->id)
                ->whereHas('order', function ($oq) use ($startDate, $endDate) {
                    $oq->whereBetween('created_at', [$startDate, $endDate])
                       ->where('status', '!=', OrderStatus::CANCELLED);
                })
                ->where('status', '!=', OrderItemStatus::CANCELLED)
                ->sum('subtotal');

            return [
                'category_id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'total_sold' => (int) $cat->total_sold,
                'total_revenue' => $revenue,
            ];
        });

        return $this->successResponse($sales, 'Distribusi penjualan per kategori berhasil diambil.');
    }

    /**
     * Export sales data to CSV stream.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $orders = Order::with(['diningTable', 'payments'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('id')
            ->get();

        $filename = 'servora_sales_' . $startDate->format('Ymd') . '_' . $endDate->format('Ymd') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            // Add UTF-8 BOM for Microsoft Excel
            fputs($file, "\xEF\xBB\xBF");

            // CSV Header
            fputcsv($file, [
                'No',
                'Nomor Pesanan',
                'Tanggal & Waktu',
                'Tipe Pesanan',
                'Meja / Pelanggan',
                'Total Tagihan (Rp)',
                'Nominal Bayar (Rp)',
                'Status Pembayaran',
                'Status Pesanan',
                'Metode Pembayaran',
            ]);

            $index = 1;
            foreach ($orders as $order) {
                $lastPayment = $order->payments->last();
                $methodStr = $lastPayment ? $lastPayment->payment_method->label() : '-';
                $destStr = $order->isDineIn() 
                    ? ($order->diningTable ? $order->diningTable->number : 'Dine-in')
                    : ($order->customer_name ? "Takeaway ({$order->customer_name})" : 'Takeaway');

                fputcsv($file, [
                    $index++,
                    $order->order_number,
                    $order->created_at->format('Y-m-d H:i:s'),
                    $order->order_type->label(),
                    $destStr,
                    number_format((float)$order->total_amount, 2, '.', ''),
                    number_format((float)$order->paid_amount, 2, '.', ''),
                    $order->payment_status->label(),
                    $order->status->label(),
                    $methodStr,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

