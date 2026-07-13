<?php

namespace App\Domains\Organization\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'nip' => $this->nip,
            'email' => $this->email,
            'rank' => $this->rank,
            'position' => $this->position,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'signature_path' => $this->signature_path,
            'roles' => $this->whenLoaded('roles', fn () => $this->getRoleNames()),
            'created_at' => $this->created_at,
        ];

        if ($this->relationLoaded('team') && $this->team) {
            $team = [
                'id' => $this->team->id,
                'name' => $this->team->name,
            ];

            if ($this->team->field) {
                $team['field'] = [
                    'id' => $this->team->field->id,
                    'name' => $this->team->field->name,
                ];
            }

            $data['team'] = $team;
        }

        return $data;
    }
}
