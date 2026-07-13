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
            'execution_date' => ['nullable', 'date', 'required_if:review_status,diterima'],
            'release_date' => ['nullable', 'date', 'required_if:review_status,diterima', 'after_or_equal:execution_date'],
            'implementation_result' => ['nullable', 'string', 'required_if:review_status,diterima'],
            'testing_result' => ['nullable', 'string', 'required_if:review_status,diterima'],
        ];
    }

    public function messages(): array
    {
        return [
            'execution_date.required_if' => 'Tanggal eksekusi wajib diisi saat perubahan diterima.',
            'release_date.required_if' => 'Tanggal rilis wajib diisi saat perubahan diterima.',
            'release_date.after_or_equal' => 'Tanggal rilis harus sama atau setelah tanggal eksekusi.',
            'implementation_result.required_if' => 'Hasil implementasi wajib diisi saat perubahan diterima.',
            'testing_result.required_if' => 'Hasil pengujian wajib diisi saat perubahan diterima.',
        ];
    }
}
