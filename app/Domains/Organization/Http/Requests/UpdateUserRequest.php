<?php

namespace App\Domains\Organization\Http\Requests;

use App\Support\Constants\Roles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'nip' => ['sometimes', 'string', 'max:50', Rule::unique('users', 'nip')->ignore($userId)],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'team_id' => ['nullable', 'exists:teams,id'],
            'rank' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['sometimes', 'string', Rule::in(Roles::ALL)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
