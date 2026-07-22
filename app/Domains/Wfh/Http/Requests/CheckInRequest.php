<?php

namespace App\Domains\Wfh\Http\Requests;

use App\Support\Constants\WfhSession;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'session' => ['nullable', 'string', Rule::in(WfhSession::ALL)],
            'date' => ['nullable', 'date', 'after_or_equal:today', 'before_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'Foto bukti kehadiran wajib diunggah.',
            'photo.image' => 'File harus berupa gambar.',
            'photo.max' => 'Ukuran foto maksimal 2MB.',
        ];
    }
}
