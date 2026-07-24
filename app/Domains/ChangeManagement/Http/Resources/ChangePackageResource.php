<?php

namespace App\Domains\ChangeManagement\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ChangePackageResource extends JsonResource
{
    /** @var \App\Domains\ChangeManagement\Models\ChangeInitiation */
    public $resource;

    public function toArray($request): array
    {
        $initiation = new InitiationResource($this->resource);
        $impl = $this->resource->relationLoaded('implementation') && $this->resource->implementation
            ? new ImplementationResource($this->resource->implementation)
            : null;

        return [
            'initiation' => $initiation,
            'implementation' => $impl,
        ];
    }
}
