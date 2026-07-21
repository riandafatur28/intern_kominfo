<?php

namespace App\Domains\Wfh\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WfhReportRecapResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'admin' => $this->whenLoaded('admin', fn () => [
                'id' => $this->admin->id,
                'name' => $this->admin->name,
                'nip' => $this->admin->nip,
            ]),
            'team' => $this->whenLoaded('team', fn () => [
                'id' => $this->team->id,
                'name' => $this->team->name,
                'field' => $this->team->relationLoaded('field') && $this->team->field ? [
                    'id' => $this->team->field->id,
                    'name' => $this->team->field->name,
                ] : null,
            ]),
            'kabid' => $this->whenLoaded('kabid', fn () => [
                'id' => $this->kabid->id,
                'name' => $this->kabid->name,
                'nip' => $this->kabid->nip,
            ]),
            'admin_id' => $this->admin_id,
            'team_id' => $this->team_id,
            'period_start' => $this->period_start->format('Y-m-d'),
            'period_end' => $this->period_end->format('Y-m-d'),
            'status' => $this->status,
            'kabid_id' => $this->kabid_id,
            'kabid_signed_at' => $this->kabid_signed_at?->toIso8601String(),
            'reject_reason' => $this->reject_reason,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
