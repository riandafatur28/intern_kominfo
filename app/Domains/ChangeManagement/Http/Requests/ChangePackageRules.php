<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use App\Models\User;
use Closure;

class ChangePackageRules
{
    public static function initiationDraft(): array
    {
        return [
            'initiation' => ['required', 'array'],
            'initiation.field_id' => ['required', 'exists:fields,id'],
            'initiation.needed_by_date' => ['nullable', 'date'],
            'initiation.description' => ['required', 'string'],
            'initiation.reason' => ['required', 'string'],
        ];
    }

    public static function initiationSubmit(): array
    {
        return [
            'initiation' => ['required', 'array'],
            'initiation.field_id' => ['required', 'exists:fields,id'],
            'initiation.needed_by_date' => ['required', 'date'],
            'initiation.description' => ['required', 'string'],
            'initiation.reason' => ['required', 'string'],
        ];
    }

    public static function implementationDraft(): array
    {
        return [
            'implementation' => ['nullable', 'array'],
            'implementation.priority' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'implementation.impact' => ['nullable', 'string', 'in:low,medium,high'],
            'implementation.production_impact' => ['nullable', 'string'],
            'implementation.required_effort' => ['nullable', 'string'],
            'implementation.cost_needed' => ['nullable', 'boolean'],
            'implementation.cost_amount' => ['nullable', 'numeric', 'required_if:implementation.cost_needed,1,true,on,yes'],
            'implementation.resources' => ['nullable', 'string'],
            'implementation.test_plan' => ['nullable', 'string'],
            'implementation.change_type_ids' => ['nullable', 'array'],
            'implementation.change_type_ids.*' => ['exists:change_types,id'],
            'implementation.execution_date' => ['nullable', 'date'],
            'implementation.release_date' => ['nullable', 'date', 'after_or_equal:implementation.execution_date'],
            'implementation.implementation_result' => ['nullable', 'string'],
            'implementation.testing_result' => ['nullable', 'string'],
            'implementation.evaluator_id' => self::evaluatorRule(),
        ];
    }

    public static function implementationSubmit(): array
    {
        return [
            'implementation' => ['required', 'array'],
            'implementation.priority' => ['required', 'string', 'in:low,medium,high,critical'],
            'implementation.impact' => ['required', 'string', 'in:low,medium,high'],
            'implementation.production_impact' => ['nullable', 'string'],
            'implementation.required_effort' => ['nullable', 'string'],
            'implementation.cost_needed' => ['nullable', 'boolean'],
            'implementation.cost_amount' => ['nullable', 'numeric', 'required_if:implementation.cost_needed,1,true,on,yes'],
            'implementation.resources' => ['nullable', 'string'],
            'implementation.test_plan' => ['required', 'string'],
            'implementation.change_type_ids' => ['required', 'array', 'min:1'],
            'implementation.change_type_ids.*' => ['exists:change_types,id'],
            'implementation.execution_date' => ['required', 'date'],
            'implementation.release_date' => ['required', 'date', 'after_or_equal:implementation.execution_date'],
            'implementation.implementation_result' => ['required', 'string'],
            'implementation.testing_result' => ['required', 'string'],
            'implementation.evaluator_id' => self::evaluatorRule(),
        ];
    }

    /** @return array<int, mixed> */
    private static function evaluatorRule(): array
    {
        return [
            'nullable',
            'integer',
            'exists:users,id',
            function (string $attribute, mixed $value, Closure $fail) {
                if (! $value || ! request()->user() || $value === request()->user()->id) {
                    return;
                }

                $evaluator = User::with('team')->find($value);

                if (! $evaluator?->is_active) {
                    $fail('Evaluator tidak ditemukan atau tidak aktif.');

                    return;
                }

                $creatorFieldId = request()->user()->team?->field_id;
                $evaluatorFieldId = $evaluator->team?->field_id;

                if ($creatorFieldId !== $evaluatorFieldId) {
                    $fail('Evaluator harus berada dalam bidang yang sama.');
                }
            },
        ];
    }
}
