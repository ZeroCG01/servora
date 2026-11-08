<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_available' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'is_available.required' => 'Status ketersediaan produk (is_available) wajib diisi.',
            'is_available.boolean' => 'Status ketersediaan harus bernilai boolean (true/false).',
        ];
    }
}

