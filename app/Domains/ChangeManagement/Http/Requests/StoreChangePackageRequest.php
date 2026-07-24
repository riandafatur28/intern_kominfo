<?php

namespace App\Domains\ChangeManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChangePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge(
            ChangePackageRules::initiationDraft(),
            ChangePackageRules::implementationDraft(),
        );
    }
}
