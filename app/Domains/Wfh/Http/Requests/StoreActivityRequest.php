<?php

namespace App\Domains\Wfh\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity' => ['required', 'string'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'id' => ['nullable', 'integer'],
            'links' => ['nullable', 'array'],
            'links.*.id' => ['nullable', 'integer'],
            'links.*.url' => ['required_with:links', 'url'],
        ];
    }
}