<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
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
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', fn() => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float)$this->price,
            'image_path' => $this->image_path,
            'image_url' => $this->image_path ? (str_starts_with($this->image_path, 'http') ? $this->image_path : Storage::url($this->image_path)) : null,
            'is_available' => (bool)$this->is_available,
            'is_active' => (bool)$this->is_active,
            'track_stock' => (bool)$this->track_stock,
            'stock_quantity' => (int)$this->stock_quantity,
            'sort_order' => (int)$this->sort_order,
            'is_in_stock' => $this->isInStock(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

