<?php

namespace App\Http\Requests\Ingredient;

use App\Enums\StockChangeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'change_type' => ['required', Rule::enum(StockChangeType::class)],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'change_type.required' => 'Tipe perubahan stok (in, out, adjustment) wajib dipilih.',
            'amount.required' => 'Jumlah kuantitas perubahan stok wajib diisi.',
            'amount.min' => 'Jumlah kuantitas minimal 0.01.',
        ];
    }
}

