<?php

namespace App\Http\Requests\DiningTable;

use Illuminate\Foundation\Http\FormRequest;

class StoreDiningTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number' => ['required', 'string', 'max:20', 'unique:dining_tables,number'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'area' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'number.required' => 'Nomor / nama meja wajib diisi.',
            'number.unique' => 'Nomor meja sudah terdaftar.',
            'capacity.min' => 'Kapasitas meja minimal 1 orang.',
        ];
    }
}

