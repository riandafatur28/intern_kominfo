<?php

namespace App\Domains\Organization\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleNames = Role::pluck('name')->toArray();

        return [
            'name' => ['required', 'string', 'max:255'],
            'nip' => ['required', 'string', 'max:50', 'unique:users,nip'],
            'email' => ['required', 'email', 'unique:users,email'],
            'team_id' => ['nullable', 'exists:teams,id'],
            'rank' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:255'],
            'roles' => ['required', 'array'],
            'roles.*' => ['string', Rule::in($roleNames)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
