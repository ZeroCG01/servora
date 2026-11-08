<?php

namespace App\Http\Resources;

use App\Enums\OrderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiningTableResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $activeOrder = $this->orders?->first(fn($order) => in_array($order->status, [
            OrderStatus::PENDING,
            OrderStatus::IN_PROGRESS,
            OrderStatus::READY,
        ]));

        return [
            'id' => $this->id,
            'number' => $this->number,
            'capacity' => (int)$this->capacity,
            'area' => $this->area,
            'is_active' => (bool)$this->is_active,
            'has_active_order' => $activeOrder !== null,
            'active_order_number' => $activeOrder?->order_number,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

