<?php

namespace App\Domains\Wfh\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sessions = \App\Models\Setting::get('wfh_sessions', ['pagi', 'siang', 'sore']);

        return [
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'session' => ['nullable', 'string', 'in:' . implode(',', $sessions)],
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
