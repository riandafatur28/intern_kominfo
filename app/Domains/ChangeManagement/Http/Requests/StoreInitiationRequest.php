<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInitiationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'field_id' => ['required', 'exists:fields,id'],
            'needed_by_date' => ['nullable', 'date'],
            'description' => ['required', 'string'],
            'reason' => ['required', 'string'],
        ];
    }
}
