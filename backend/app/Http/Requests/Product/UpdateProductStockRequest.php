<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'track_stock' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'stock_quantity.required' => 'Jumlah stok porsi wajib diisi.',
            'stock_quantity.integer' => 'Jumlah stok harus berupa bilangan bulat.',
            'stock_quantity.min' => 'Jumlah stok tidak boleh kurang dari 0.',
        ];
    }
}

