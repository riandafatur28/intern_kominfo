<?php

namespace App\Domains\Wfh\Http\Requests;

use App\Domains\Wfh\Models\WfhAttendance;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'wfh_attendance_id' => ['nullable', 'exists:wfh_attendances,id', function (string $attribute, mixed $value, Closure $fail) {
                if ($value && WfhAttendance::where('id', $value)->where('user_id', auth()->id())->doesntExist()) {
                    $fail('Absensi WFH tidak ditemukan untuk user ini.');
                }
            }],
            'report_date' => ['required', 'date'],
            'activities' => ['required', 'array', 'min:1'],
            'activities.*.start_time' => ['required', 'date_format:H:i'],
            'activities.*.end_time' => ['required', 'date_format:H:i', 'after:activities.*.start_time'],
            'activities.*.activity' => ['required', 'string'],
            'activities.*.links' => ['nullable', 'array'],
            'activities.*.links.*' => ['url'],
        ];
    }

    public function messages(): array
    {
        return [
            'activities.required' => 'Minimal satu kegiatan harus diisi.',
            'activities.min' => 'Minimal satu kegiatan harus diisi.',
            'activities.*.end_time.after' => 'Waktu selesai harus setelah waktu mulai.',
            'activities.*.links.*.url' => 'Link bukti kerja harus berupa URL yang valid.',
        ];
    }
}
