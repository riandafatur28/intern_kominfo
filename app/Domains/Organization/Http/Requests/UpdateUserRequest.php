<?php

namespace App\Domains\Organization\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');
        $roleNames = Role::pluck('name')->toArray();

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'nip' => ['sometimes', 'string', 'max:50', Rule::unique('users', 'nip')->ignore($userId)],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'team_id' => ['nullable', 'exists:teams,id'],
            'rank' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::in($roleNames)],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
