<?php

namespace App\Http\Requests\Order;

use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_request_id' => ['nullable', 'string', 'max:64'],
            'order_type' => ['required', Rule::enum(OrderType::class)],
            'dining_table_id' => [
                'nullable',
                Rule::requiredIf(fn() => $this->input('order_type') === OrderType::DINE_IN->value),
                'exists:dining_tables,id',
            ],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'scheduled_for' => ['nullable', 'date', 'after:now'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.special_instructions' => ['nullable', 'string', 'max:255'],

            'payment' => ['nullable', 'array'],
            'payment.payment_type' => ['nullable', Rule::enum(PaymentType::class)],
            'payment.payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'payment.amount' => ['required_with:payment', 'numeric', 'min:0.01'],
            'payment.notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'order_type.required' => 'Tipe pesanan (Dine-in / Takeaway) wajib dipilih.',
            'dining_table_id.required_if' => 'Nomor meja wajib dipilih untuk pesanan Dine-in.',
            'dining_table_id.exists' => 'Meja yang dipilih tidak valid.',
            'scheduled_for.after' => 'Waktu jadwal Pre-Order harus di masa mendatang.',
            'items.required' => 'Pesanan harus berisi minimal 1 item produk.',
            'items.min' => 'Pesanan harus berisi minimal 1 item produk.',
            'items.*.product_id.required' => 'ID produk wajib disertakan.',
            'items.*.product_id.exists' => 'Produk menu yang dipilih tidak ditemukan.',
            'items.*.quantity.min' => 'Jumlah pesanan minimal 1 porsi.',
            'payment.amount.required_with' => 'Nominal pembayaran wajib diisi jika menyertakan pembayaran.',
        ];
    }
}

