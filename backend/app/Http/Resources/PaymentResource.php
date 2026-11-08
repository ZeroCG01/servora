<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'payment_type' => $this->payment_type->value ?? (string)$this->payment_type,
            'payment_type_label' => $this->payment_type->label(),
            'payment_method' => $this->payment_method->value ?? (string)$this->payment_method,
            'payment_method_label' => $this->payment_method->label(),
            'amount' => (float)$this->amount,
            'change_amount' => (float)$this->change_amount,
            'notes' => $this->notes,
            'receiver' => $this->receiver ? [
                'id' => $this->receiver->id,
                'name' => $this->receiver->name,
                'username' => $this->receiver->username,
            ] : null,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

