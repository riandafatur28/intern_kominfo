<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreImplementationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'priority' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'impact' => ['nullable', 'string', 'in:low,medium,high'],
            'production_impact' => ['nullable', 'string'],
            'required_effort' => ['nullable', 'string'],
            'cost_needed' => ['nullable', 'boolean'],
            'cost_amount' => ['nullable', 'numeric', 'required_if:cost_needed,1,true,on,yes'],
            'resources' => ['nullable', 'string'],
            'test_plan' => ['nullable', 'string'],
            'change_type_ids' => ['nullable', 'array'],
            'change_type_ids.*' => ['exists:change_types,id'],
            'implementation_result' => ['nullable', 'string'],
            'testing_result' => ['nullable', 'string'],
        ];
    }
}
