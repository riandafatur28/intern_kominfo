<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Http\Resources\WfhReportResource;
use App\Domains\Wfh\Models\WfhReport;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Domains\Wfh\Services\WfhReportStateMachine;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ReportApprovalController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
        private WfhReportStateMachine $stateMachine,
    ) {}

    public function submit(Request $request, int $id): JsonResponse
    {
        $report = WfhReport::find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if ($report->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pembuat laporan yang dapat mensubmit.',
            ], 403);
        }

        try {
            $report = $this->stateMachine->submit($report, $request->user());
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil disubmit untuk persetujuan.',
            'data' => new WfhReportResource($report->load(['activities.links', 'supervisor'])),
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $this->authorize('wfh.report.approve');

        $report = WfhReport::find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        try {
            $report = $this->stateMachine->approve($report, $request->user());
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil disetujui.',
            'data' => new WfhReportResource($report->load(['activities.links', 'supervisor'])),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $this->authorize('wfh.report.reject');

        $request->validate([
            'reason' => ['required', 'string'],
        ]);

        $report = WfhReport::find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        try {
            $report = $this->stateMachine->reject($report, $request->user(), $request->input('reason'));
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan ditolak.',
            'data' => new WfhReportResource($report->load(['activities.links', 'supervisor'])),
        ]);
    }

    public function revise(Request $request, int $id): JsonResponse
    {
        $report = WfhReport::find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if ($report->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pembuat laporan yang dapat merevisi.',
            ], 403);
        }

        try {
            $report = $this->stateMachine->revise($report);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan dikembalikan ke draft untuk revisi.',
            'data' => new WfhReportResource($report),
        ]);
    }
}
