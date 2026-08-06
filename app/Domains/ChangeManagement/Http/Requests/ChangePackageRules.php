<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use App\Models\User;
use Closure;

class ChangePackageRules
{
    public static function initiationDraft(): array
    {
        return self::initiationRules(submit: false);
    }

    /** Rules for updating an existing package — field_id already set on the record. */
    public static function initiationUpdate(): array
    {
        return [
            'initiation' => ['sometimes', 'array'],
            'initiation.field_id' => ['sometimes', 'exists:fields,id'],
            'initiation.needed_by_date' => ['nullable', 'date'],
            'initiation.description' => ['required', 'string'],
            'initiation.reason' => ['required', 'string'],
        ];
    }

    public static function initiationSubmit(): array
    {
        return self::initiationRules(submit: true);
    }

    public static function implementationDraft(): array
    {
        return self::implementationRules(submit: false);
    }

    public static function implementationSubmit(): array
    {
        return self::implementationRules(submit: true);
    }

    private static function initiationRules(bool $submit): array
    {
        return [
            'initiation' => ['required', 'array'],
            'initiation.field_id' => ['required', 'exists:fields,id'],
            'initiation.needed_by_date' => [$submit ? 'required' : 'nullable', 'date'],
            'initiation.description' => ['required', 'string'],
            'initiation.reason' => ['required', 'string'],
        ];
    }

    private static function implementationRules(bool $submit): array
    {
        $presence = $submit ? 'required' : 'nullable';

        return [
            'implementation' => [$presence, 'array'],
            'implementation.priority' => [$presence, 'string', 'in:normal,emergency'],
            'implementation.impact' => [$presence, 'string', 'in:Minor,Mayor'],
            'implementation.production_impact' => ['nullable', 'string'],
            'implementation.required_effort' => ['nullable', 'string'],
            'implementation.cost_needed' => ['nullable', 'boolean'],
            'implementation.cost_amount' => ['nullable', 'numeric', 'required_if:implementation.cost_needed,1,true,on,yes'],
            'implementation.resources' => ['nullable', 'string'],
            'implementation.test_plan' => [$presence, 'string'],
            'implementation.change_type_ids' => $submit
                ? ['required', 'array', 'min:1']
                : ['nullable', 'array'],
            'implementation.change_type_ids.*' => ['exists:change_types,id'],
            'implementation.execution_date' => [$presence, 'date'],
            'implementation.release_date' => [$presence, 'date', function (string $attribute, mixed $value, Closure $fail) {
    if ($value === null) return;
    $executionDate = request()->input('implementation.execution_date');
    if ($executionDate === null) return;
    if ($value < $executionDate) {
        $fail('Tanggal rilis harus setelah atau sama dengan tanggal eksekusi.');
    }
}],
            'implementation.implementation_result' => [$presence, 'string'],
            'implementation.review_response' => ['nullable', 'string'],
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
