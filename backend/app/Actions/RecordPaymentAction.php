<?php

namespace App\Actions;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RecordPaymentAction
{
    /**
     * Record a payment (Full, DP / Down Payment, or Settlement) for an order.
     */
    public function execute(
        Order $order,
        PaymentType|string $type,
        PaymentMethod|string $method,
        float $amount,
        User $receiver,
        ?string $notes = null
    ): Payment {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Nominal pembayaran harus lebih besar dari 0.');
        }

        $typeValue = $type instanceof PaymentType ? $type->value : $type;
        $methodValue = $method instanceof PaymentMethod ? $method->value : $method;

        return DB::transaction(function () use ($order, $typeValue, $methodValue, $amount, $receiver, $notes) {
            $remainingBefore = $order->remainingAmount();
            $changeAmount = 0.00;

            // If cash and paid amount exceeds remaining bill, calculate change
            if ($methodValue === PaymentMethod::CASH->value && $amount > $remainingBefore) {
                $changeAmount = $amount - $remainingBefore;
            }

            $effectivePaid = $amount - $changeAmount;

            $payment = $order->payments()->create([
                'payment_type' => $typeValue,
                'payment_method' => $methodValue,
                'amount' => $amount,
                'change_amount' => $changeAmount,
                'notes' => $notes,
                'received_by' => $receiver->id,
                'paid_at' => now(),
            ]);

            // Accumulate paid amount on order
            $newPaidAmount = (float)$order->paid_amount + $effectivePaid;
            $newPaymentStatus = PaymentStatus::UNPAID;
            $paidAt = $order->paid_at;

            if ($newPaidAmount >= (float)$order->total_amount) {
                $newPaymentStatus = PaymentStatus::PAID;
                $paidAt = $paidAt ?? now();
            } elseif ($newPaidAmount > 0) {
                $newPaymentStatus = PaymentStatus::PARTIALLY_PAID;
            }

            $order->update([
                'paid_amount' => $newPaidAmount,
                'payment_status' => $newPaymentStatus,
                'paid_at' => $paidAt,
            ]);

            return $payment;
        });
    }
}

