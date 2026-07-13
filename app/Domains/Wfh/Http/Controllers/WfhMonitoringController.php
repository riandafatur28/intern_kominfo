<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class WfhMonitoringController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('wfh.monitoring.view');

        $date = $request->input('date', now()->toDateString());
        $teamId = $request->input('team_id');

        // Kepala tim sees own team only, admin sees all
        if (! $request->user()->hasRole('admin') && $teamId === null) {
            $teamId = $request->user()->ledTeams()->pluck('id')->first()
                ?? $request->user()->team_id;
        }

        $notCheckedIn = $this->wfhRepository->getUsersWithoutAttendance($date, $teamId);
        $noReport = $this->wfhRepository->getUsersWithoutReport($date, $teamId);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'team_id' => $teamId,
                'not_checked_in' => $notCheckedIn,
                'no_report' => $noReport,
            ],
        ]);
    }
}
