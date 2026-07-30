<?php

namespace App\Domains\ChangeManagement\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ChangeTypeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
