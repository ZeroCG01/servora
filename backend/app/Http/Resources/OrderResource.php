<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'client_request_id' => $this->client_request_id,
            'order_type' => $this->order_type->value ?? (string)$this->order_type,
            'order_type_label' => $this->order_type->label(),
            'dining_table_id' => $this->dining_table_id,
            'dining_table' => $this->diningTable ? [
                'id' => $this->diningTable->id,
                'number' => $this->diningTable->number,
                'area' => $this->diningTable->area,
            ] : null,
            'customer_name' => $this->customer_name,
            'notes' => $this->notes,
            'status' => $this->status->value ?? (string)$this->status,
            'status_label' => $this->status->label(),
            'total_amount' => (float)$this->total_amount,
            'paid_amount' => (float)$this->paid_amount,
            'remaining_amount' => $this->remainingAmount(),
            'payment_status' => $this->payment_status->value ?? (string)$this->payment_status,
            'payment_status_label' => $this->payment_status->label(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_by' => $this->created_by,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
                'username' => $this->creator->username,
            ] : null,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancel_reason' => $this->cancel_reason,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'scheduled_order' => $this->whenLoaded('scheduledOrder', fn() => new ScheduledOrderResource($this->scheduledOrder)),
            'status_histories' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

