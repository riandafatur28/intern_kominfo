<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitChangePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validate that all required business fields are present on submit.
     * The frontend may send the full payload alongside the transition,
     * or rely on previously-saved data. Either way, the rules ensure
     * no incomplete package escapes the draft state.
     */
    public function rules(): array
    {
        return array_merge(
            ChangePackageRules::initiationSubmit(),
            ChangePackageRules::implementationSubmit(),
        );
    }
}
