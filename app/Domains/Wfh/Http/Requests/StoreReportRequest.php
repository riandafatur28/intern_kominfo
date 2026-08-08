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
}
