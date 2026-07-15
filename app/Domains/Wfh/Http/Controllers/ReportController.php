<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Http\Requests\StoreReportRequest;
use App\Domains\Wfh\Http\Resources\WfhReportResource;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Domains\Wfh\Services\WfhReportStateMachine;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ReportController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
        private WfhReportStateMachine $stateMachine,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min($request->integer('per_page', 15), 100);
        $reports = $this->wfhRepository->paginateReportsForUser($request->user()->id, $perPage);

        return response()->json([
            'success' => true,
            'data' => WfhReportResource::collection($reports->items()),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $this->authorize('wfh.monitoring.view');

        $fieldId = $request->user()->team?->field?->id;

        if (! $fieldId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terhubung dengan bidang manapun.',
            ], 422);
        }

        $perPage = min($request->integer('per_page', 15), 100);
        $filters = array_filter([
            'field_id' => $fieldId,
            'status' => $request->input('status'),
            'team_id' => $request->input('team_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ], fn ($value) => $value !== null && $value !== '');

        $reports = $this->wfhRepository->paginateAllReports($perPage, $filters);

        return response()->json([
            'success' => true,
            'data' => WfhReportResource::collection($reports->items()),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    public function store(StoreReportRequest $request): JsonResponse
    {
        $this->authorize('wfh.report.create');

        $report = $this->wfhRepository->createReportWithRelations(
            reportData: [
                'user_id' => $request->user()->id,
                'wfh_attendance_id' => $request->input('wfh_attendance_id'),
                'report_date' => $request->input('report_date'),
                'status' => 'draft',
            ],
            activities: $request->input('activities'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Laporan WFH berhasil dibuat.',
            'data' => new WfhReportResource($report),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $report = $this->wfhRepository->findReportWithRelations($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if ($report->user_id !== request()->user()->id) {
            $this->authorize('wfh.monitoring.view');
        }

        return response()->json([
            'success' => true,
            'data' => new WfhReportResource($report),
        ]);
    }

    public function update(StoreReportRequest $request, int $id): JsonResponse
    {
        $report = $this->wfhRepository->findReportWithRelations($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if ($report->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat mengubah laporan orang lain.',
            ], 403);
        }

        if (! $this->stateMachine->canEdit($report)) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan yang sudah disetujui tidak dapat diubah.',
            ], 422);
        }

        $this->wfhRepository->updateReportWithRelations(
            id: $id,
            reportData: ['report_date' => $request->input('report_date')],
            activities: $request->input('activities'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Laporan WFH berhasil diperbarui.',
            'data' => new WfhReportResource($this->wfhRepository->findReportWithRelations($id)),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $report = $this->wfhRepository->findReportWithRelations($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if ($report->user_id !== request()->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus laporan orang lain.',
            ], 403);
        }

        if (! $this->stateMachine->canEdit($report)) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan yang sudah disetujui tidak dapat dihapus.',
            ], 422);
        }

        $this->wfhRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Laporan WFH berhasil dihapus.',
        ]);
    }
}
