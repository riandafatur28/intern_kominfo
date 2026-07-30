<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DecideChangePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string'],
        ];
    }
}
