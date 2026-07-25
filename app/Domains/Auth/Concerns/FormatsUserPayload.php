<?php

namespace App\Domains\Auth\Concerns;

use App\Models\User;

trait FormatsUserPayload
{
    private function formatUserPayload(User $user): array
    {
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'nip' => $user->nip,
            'email' => $user->email,
            'rank' => $user->rank,
            'position' => $user->position,
            'phone' => $user->phone,
            'signature_path' => $user->signature_path,
            'signature_url' => $user->signature_path
                ? asset("storage/{$user->signature_path}")
                : null,
            'must_change_password' => $user->must_change_password,
            'is_active' => $user->is_active,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ];

        if ($user->relationLoaded('team') && $user->team) {
            $team = [
                'id' => $user->team->id,
                'name' => $user->team->name,
            ];

            if ($user->team->leader) {
                $team['leader'] = [
                    'id' => $user->team->leader->id,
                    'name' => $user->team->leader->name,
                ];
            }

            if ($user->team->field) {
                $team['field'] = [
                    'id' => $user->team->field->id,
                    'name' => $user->team->field->name,
                ];
            }

            $data['team'] = $team;
        }

        return $data;
    }
}
