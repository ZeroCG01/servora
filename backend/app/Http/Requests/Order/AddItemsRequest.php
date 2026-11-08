<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class AddItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.special_instructions' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Daftar item tambahan wajib disertakan.',
            'items.min' => 'Minimal sertakan 1 item menu tambahan.',
            'items.*.product_id.required' => 'ID produk wajib disertakan.',
            'items.*.product_id.exists' => 'Produk menu yang dipilih tidak ditemukan.',
            'items.*.quantity.min' => 'Jumlah pesanan minimal 1 porsi.',
        ];
    }
}

