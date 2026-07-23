<?php

namespace App\Domains\Wfh\Services;

use App\Domains\Wfh\Models\WfhTeamReport;

class TeamReportStateMachine
{
    public function approve(WfhTeamReport $report): WfhTeamReport
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

    public function reject(WfhTeamReport $report, string $reason): WfhTeamReport
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
}
