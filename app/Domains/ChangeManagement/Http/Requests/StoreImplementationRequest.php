<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use App\Models\User;
use Closure;
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
            'evaluator_id' => [
                'nullable',
                'integer',
                'exists:users,id',
                function (string $attribute, mixed $value, Closure $fail) {
                    if (! $value || $value === $this->user()->id) {
                        return;
                    }

                    $evaluator = User::with('team')->find($value);

                    if (! $evaluator?->is_active) {
                        $fail('Evaluator tidak ditemukan atau tidak aktif.');

                        return;
                    }

                    $creatorFieldId = $this->user()->team?->field_id;
                    $evaluatorFieldId = $evaluator->team?->field_id;

                    if ($creatorFieldId !== $evaluatorFieldId) {
                        $fail('Evaluator harus berada dalam bidang yang sama.');
                    }
                },
            ],
        ];
    }
}
