<?php

namespace App\Http\Requests\DiningTable;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiningTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tableId = $this->route('dining_table') instanceof \App\Models\DiningTable 
            ? $this->route('dining_table')->id 
            : $this->route('dining_table');

        return [
            'number' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('dining_tables', 'number')->ignore($tableId)],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'area' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'number.unique' => 'Nomor meja sudah terdaftar.',
            'capacity.min' => 'Kapasitas meja minimal 1 orang.',
        ];
    }
}

