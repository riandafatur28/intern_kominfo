<?php

namespace App\Domains\Wfh\Services;

use App\Domains\Wfh\Models\WfhReport;
use App\Models\User;

class WfhReportStateMachine
{
    public function submit(WfhReport $report, User $maker): WfhReport
    {
        if ($report->status !== 'draft') {
            throw new \DomainException('Hanya laporan dengan status draft yang dapat disubmit.');
        }

        $report->update([
            'status' => 'pending',
            'maker_signed_at' => now(),
        ]);

        $headId = $maker->team?->field?->head_id;
        if ($headId && $headId !== $maker->id) {
            $report->update(['supervisor_id' => $headId]);
        }

        return $report->fresh();
    }

    public function approve(WfhReport $report, User $supervisor): WfhReport
    {
        if ($report->status !== 'pending') {
            throw new \DomainException('Hanya laporan dengan status pending yang dapat disetujui.');
        }

        $report->update([
            'status' => 'approved',
            'supervisor_signed_at' => now(),
            'verification_token' => $report->verification_token ?? bin2hex(random_bytes(32)),
        ]);

        return $report->fresh();
    }

    public function reject(WfhReport $report, User $supervisor, string $reason): WfhReport
    {
        if ($report->status !== 'pending') {
            throw new \DomainException('Hanya laporan dengan status pending yang dapat ditolak.');
        }

        $report->update([
            'status' => 'rejected',
            'reject_reason' => $reason,
        ]);

        return $report->fresh();
    }


    public function revise(WfhReport $report): WfhReport
    {
        if ($report->status !== 'rejected') {
            throw new \DomainException('Hanya laporan yang ditolak yang dapat direvisi.');
        }

        $report->update([
            'status' => 'draft',
            'maker_signed_at' => null,
            'supervisor_id' => null,
            'reject_reason' => null,
        ]);

        return $report->fresh();
    }

    public function canEdit(WfhReport $report): bool
    {
        return in_array($report->status, ['draft', 'rejected']);
    }

    public function isImmutable(WfhReport $report): bool
    {
        return $report->status === 'approved';
    }
}
