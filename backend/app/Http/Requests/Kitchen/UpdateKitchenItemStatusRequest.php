<?php

namespace App\Http\Requests\Kitchen;

use App\Enums\OrderItemStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKitchenItemStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    OrderItemStatus::PENDING->value,
                    OrderItemStatus::ON_PROGRESS->value,
                    OrderItemStatus::READY->value,
                    OrderItemStatus::SERVED->value,
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status baru item menu wajib dipilih.',
            'status.in' => 'Status harus berupa pending, on_progress, ready, atau served.',
        ];
    }
}

