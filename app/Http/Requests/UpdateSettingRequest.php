<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // authorized via route middleware
    }

    public function rules(): array
    {
        return [
            'value' => ['required'],
        ];
    }

    public function messages(): array
    {
        return [
            'value.required' => 'Nilai setting wajib diisi.',
        ];
    }
}
