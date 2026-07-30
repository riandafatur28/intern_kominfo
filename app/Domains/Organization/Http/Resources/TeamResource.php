<?php

namespace App\Domains\Organization\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'leader_id' => $this->leader_id,
            'field_id' => $this->field_id,
        ];
    }
}
