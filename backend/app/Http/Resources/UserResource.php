<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'is_active' => (bool)$this->is_active,
            'role' => $this->role ? [
                'id' => $this->role->id,
                'name' => $this->role->name->value ?? $this->role->name,
                'display_name' => $this->role->display_name,
            ] : null,
            'assigned_stations' => $this->categories ? $this->categories->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]) : [],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

