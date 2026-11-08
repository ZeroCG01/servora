<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class SyncCategoriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_ids' => ['present', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_ids.present' => 'Daftar category_ids harus disediakan (array).',
            'category_ids.*.exists' => 'Kategori stasiun yang dipilih tidak valid.',
        ];
    }
}

