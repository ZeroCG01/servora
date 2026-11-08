<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IngredientStockLogResource extends JsonResource
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
            'ingredient_id' => $this->ingredient_id,
            'change_type' => $this->change_type->value ?? (string)$this->change_type,
            'change_type_label' => $this->change_type->label(),
            'amount' => (float)$this->amount,
            'previous_stock' => (float)$this->previous_stock,
            'final_stock' => (float)$this->final_stock,
            'reason' => $this->reason,
            'adjuster' => $this->adjuster ? [
                'id' => $this->adjuster->id,
                'name' => $this->adjuster->name,
                'username' => $this->adjuster->username,
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

