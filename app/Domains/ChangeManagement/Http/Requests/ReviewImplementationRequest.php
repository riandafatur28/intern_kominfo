<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewImplementationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'review_status' => ['required', 'string', 'in:diterima,ditolak,revisi'],
            'review_response' => ['nullable', 'string'],
            'execution_date' => ['nullable', 'date'],
            'release_date' => ['nullable', 'date'],
            'implementation_result' => ['nullable', 'string'],
            'testing_result' => ['nullable', 'string'],
        ];
    }
}
