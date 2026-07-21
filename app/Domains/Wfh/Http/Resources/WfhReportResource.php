<?php

namespace App\Domains\Wfh\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class WfhReportResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'wfh_attendance_id' => $this->wfh_attendance_id,
            'report_date' => $this->report_date?->format('Y-m-d'),
            'status' => $this->status,
            'maker_signed_at' => $this->maker_signed_at,
            'supervisor_signed_at' => $this->supervisor_signed_at,
            'reject_reason' => $this->reject_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('user')) {
            $data['user'] = [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'nip' => $this->user->nip,
                'position' => $this->user->position,
                'rank' => $this->user->rank,
                'signature_path' => $this->user->signature_path,
                'signature_url' => $this->user->signature_path
                    ? asset("storage/{$this->user->signature_path}")
                    : null,
            ];
        }

        if ($this->relationLoaded('supervisor') && $this->supervisor) {
            $data['supervisor'] = [
                'id' => $this->supervisor->id,
                'name' => $this->supervisor->name,
                'nip' => $this->supervisor->nip,
                'position' => $this->supervisor->position,
                'rank' => $this->supervisor->rank,
                'signature_path' => $this->supervisor->signature_path,
                'signature_url' => $this->supervisor->signature_path
                    ? asset("storage/{$this->supervisor->signature_path}")
                    : null,
            ];
        }

        if ($this->relationLoaded('activities')) {
            $data['activities'] = $this->activities->map(function ($activity) {
                $act = [
                    'id' => $activity->id,
                    'start_time' => $activity->start_time,
                    'end_time' => $activity->end_time,
                    'activity' => $activity->activity,
                    'sort_order' => $activity->sort_order,
                ];

                if ($activity->relationLoaded('links')) {
                    $act['links'] = $activity->links->map(fn ($link) => [
                        'id' => $link->id,
                        'url' => $link->url,
                        'sort_order' => $link->sort_order,
                    ]);
                }

                return $act;
            });
        }

        return $data;
    }
}
