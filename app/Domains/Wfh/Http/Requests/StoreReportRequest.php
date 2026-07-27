<?php

namespace App\Domains\Wfh\Http\Requests;

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
            'report_date' => ['required', 'date'],
            'activities' => ['sometimes', 'array'],
            'activities.*.start_time' => ['required_with:activities.*.end_time', 'date_format:H:i'],
            'activities.*.end_time' => ['required_with:activities.*.start_time', 'date_format:H:i', 'after:activities.*.start_time'],
            'activities.*.activity' => ['required', 'string'],
            'activities.*.links' => ['nullable', 'array'],
            'activities.*.links.*' => ['url'],
            'attendances' => ['sometimes', 'array:pagi,siang,sore'],
            'attendances.*.photo' => ['sometimes', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    /* ponytail: deprecated; replaced by Task 9 DB-side content guard.
     * Keep for now to not break existing POST-with-submit flow. */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('status') !== 'submit') {
                return;
            }

            $hasPhoto = ! empty($this->file('attendances.pagi.photo'))
                || ! empty($this->file('attendances.siang.photo'))
                || ! empty($this->file('attendances.sore.photo'));

            $activities = $this->input('activities');
            $hasActivity = is_array($activities) && count($activities) > 0;

            if (! $hasPhoto && ! $hasActivity) {
                $validator->errors()->add('attendances', 'Setidaknya satu foto absensi atau satu kegiatan harus diisi.');
            }
        });
    }
}
