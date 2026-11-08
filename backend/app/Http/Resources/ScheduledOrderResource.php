<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduledOrderResource extends JsonResource
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
            'scheduled_for' => $this->scheduled_for?->toIso8601String(),
            'remind_at' => $this->remind_at?->toIso8601String(),
            'reminder_status' => $this->reminder_status->value ?? (string)$this->reminder_status,
            'reminder_status_label' => $this->reminder_status->label(),
            'reminder_sent_at' => $this->reminder_sent_at?->toIso8601String(),
        ];
    }
}

