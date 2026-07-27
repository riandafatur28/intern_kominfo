<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Http\Requests\StoreActivityRequest;
use App\Domains\Wfh\Models\WfhReport;
use App\Domains\Wfh\Models\WfhReportActivity;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Domains\Wfh\Services\WfhReportStateMachine;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ReportActivityController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
        private WfhReportStateMachine $stateMachine,
    ) {}

    public function store(WfhReport $report, StoreActivityRequest $request): JsonResponse
    {
        if (! $this->stateMachine->canEdit($report)) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak dapat diedit.',
            ], 422);
        }

        if ($report->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke laporan ini.',
            ], 403);
        }

        $activity = $this->wfhRepository->addActivityToReport($report, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Kegiatan berhasil ditambahkan.',
            'data' => $this->formatActivity($activity),
        ], 201);
    }

    public function update(WfhReport $report, WfhReportActivity $activity, StoreActivityRequest $request): JsonResponse
    {
        if ($activity->wfh_report_id !== $report->id) {
            return response()->json([
                'success' => false,
                'message' => 'Kegiatan tidak ditemukan.',
            ], 404);
        }

        if (! $this->stateMachine->canEdit($report)) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak dapat diedit.',
            ], 422);
        }

        if ($report->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke laporan ini.',
            ], 403);
        }

        $activity = $this->wfhRepository->updateActivity($activity, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Kegiatan berhasil diperbarui.',
            'data' => $this->formatActivity($activity),
        ]);
    }

    public function destroy(WfhReport $report, WfhReportActivity $activity): JsonResponse
    {
        if ($activity->wfh_report_id !== $report->id) {
            return response()->json([
                'success' => false,
                'message' => 'Kegiatan tidak ditemukan.',
            ], 404);
        }

        if (! $this->stateMachine->canEdit($report)) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak dapat diedit.',
            ], 422);
        }

        if ($report->user_id !== request()->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke laporan ini.',
            ], 403);
        }

        $this->wfhRepository->deleteActivity($activity->id);

        return response()->json([
            'success' => true,
            'message' => 'Kegiatan berhasil dihapus.',
        ]);
    }

    public function reorder(WfhReport $report, Request $request): JsonResponse
    {
        if (! $this->stateMachine->canEdit($report)) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak dapat diedit.',
            ], 422);
        }

        if ($report->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke laporan ini.',
            ], 403);
        }

        $ids = $request->input('ids', []);

        try {
            $this->wfhRepository->reorderActivities($report, $ids);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Urutan kegiatan berhasil diubah.',
        ]);
    }

    private function formatActivity(WfhReportActivity $activity): array
    {
        $links = $activity->relationLoaded('links')
            ? $activity->links->map(fn ($link) => [
                'id' => $link->id,
                'url' => $link->url,
            ])->toArray()
            : [];

        return [
            'id' => $activity->id,
            'activity' => $activity->activity,
            'start_time' => $activity->start_time?->format('H:i'),
            'end_time' => $activity->end_time?->format('H:i'),
            'sort_order' => $activity->sort_order,
            'links' => $links,
        ];
    }
}
