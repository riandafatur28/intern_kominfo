<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadChangePackageAttachmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'max:10'],
            'files.*' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
        ];
    }
}
