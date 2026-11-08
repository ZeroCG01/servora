<?php

namespace App\Http\Requests\Ingredient;

use Illuminate\Foundation\Http\FormRequest;

class StoreIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'current_stock' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:30'],
            'minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama bahan baku wajib diisi.',
            'unit.required' => 'Satuan bahan baku (kg, gram, liter, pcs, dll.) wajib diisi.',
            'category_id.exists' => 'Kategori stasiun tidak valid.',
        ];
    }
}

