<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitChangePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge(
            ChangePackageRules::initiationSubmit(),
            ChangePackageRules::implementationSubmit(),
        );
    }

    public function messages(): array
    {
        return [
            'initiation.needed_by_date.required' => 'Tanggal dibutuhkan wajib diisi saat submit.',
            'implementation.change_type_ids.required' => 'Minimal satu jenis perubahan wajib dipilih.',
            'implementation.change_type_ids.min' => 'Minimal satu jenis perubahan wajib dipilih.',
            'implementation.test_plan.required' => 'Rencana pengujian wajib diisi saat submit.',
            'implementation.execution_date.required' => 'Tanggal eksekusi wajib diisi saat submit.',
            'implementation.release_date.required' => 'Tanggal rilis wajib diisi saat submit.',
            'implementation.implementation_result.required' => 'Hasil implementasi wajib diisi saat submit.',
            'implementation.testing_result.required' => 'Hasil pengujian wajib diisi saat submit.',
        ];
    }
}
