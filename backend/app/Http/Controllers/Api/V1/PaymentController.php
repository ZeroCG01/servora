<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\RecordPaymentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    /**
     * List all payments made for a specific order.
     */
    public function index(Order $order): JsonResponse
    {
        $payments = $order->payments()->with('receiver')->orderBy('id')->get();

        return $this->successResponse(PaymentResource::collection($payments), 'Daftar pembayaran pesanan berhasil diambil.');
    }

    /**
     * Record a new payment (DP / Down Payment, Settlement / Pelunasan, or Full Payment).
     */
    public function store(StorePaymentRequest $request, Order $order, RecordPaymentAction $action): JsonResponse
    {
        $validated = $request->validated();

        $payment = $action->execute(
            $order,
            $validated['payment_type'],
            $validated['payment_method'],
            (float) $validated['amount'],
            $request->user(),
            $validated['notes'] ?? null
        );

        $order->load(['payments.receiver', 'diningTable', 'items']);

        return $this->successResponse([
            'payment' => new PaymentResource($payment),
            'order' => new OrderResource($order),
        ], 'Pembayaran berhasil dicatat.', 201);
    }
}

