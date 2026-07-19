<?php

namespace App\Domains\Organization\Http\Requests;

use App\Rules\SignatureImage;
use Illuminate\Foundation\Http\FormRequest;

class UploadSignatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'signature' => [
                'required', 'image', 'mimes:png,jpg,jpeg', 'max:2048',
                'dimensions:max_width=2000,max_height=2000',
                new SignatureImage,
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'signature.required' => 'File tanda tangan wajib diunggah.',
            'signature.image' => 'File harus berupa gambar.',
            'signature.mimes' => 'Format file harus PNG, JPG, atau JPEG.',
            'signature.max' => 'Ukuran file maksimal 2MB.',
            'signature.dimensions' => 'Dimensi gambar maksimal 2000x2000 pixel.',
        ];
    }
}
