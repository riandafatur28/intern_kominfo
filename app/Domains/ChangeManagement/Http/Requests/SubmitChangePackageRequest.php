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
     * Data is already saved + validated via PUT before calling submit.
     * The submit endpoint only transitions status. Relax rules to avoid
     * re-validating fields the frontend doesn't resend.
     */
    public function rules(): array
    {
        return [];
    }
}
