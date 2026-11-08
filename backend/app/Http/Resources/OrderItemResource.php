<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'product_id' => $this->product_id,
            'category_id' => $this->category_id,
            'category_name' => $this->category?->name,
            'product_name' => $this->product_name,
            'unit_price' => (float)$this->unit_price,
            'quantity' => (int)$this->quantity,
            'subtotal' => (float)$this->subtotal,
            'special_instructions' => $this->special_instructions,
            'status' => $this->status->value ?? (string)$this->status,
            'status_label' => $this->status->label(),
            'batch_no' => (int)$this->batch_no,
            'started_at' => $this->started_at?->toIso8601String(),
            'ready_at' => $this->ready_at?->toIso8601String(),
            'served_at' => $this->served_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancel_reason' => $this->cancel_reason,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

