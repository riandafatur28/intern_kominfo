<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadAttachmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array'],
            'files.*' => ['image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:max_width=2000,max_height=2000'],
        ];
    }
}
