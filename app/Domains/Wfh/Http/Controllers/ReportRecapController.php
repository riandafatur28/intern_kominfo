<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Http\Resources\WfhReportRecapResource;
use App\Domains\Wfh\Models\WfhReport;
use App\Domains\Wfh\Models\WfhReportRecap;
use App\Models\Team;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ReportRecapController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Kepala bidang: bisa akses semua field yang dikepalai
        $fieldIds = collect();
        if ($user->hasRole('kepala_bidang')) {
            $fieldIds = $user->headedFields->pluck('id');
        }
        if ($fieldIds->isEmpty()) {
            $fieldId = $user->team?->field?->id;
            if ($fieldId) {
                $fieldIds = collect([$fieldId]);
            }
        }

        if ($fieldIds->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terhubung dengan bidang manapun.',
            ], 422);
        }

        $query = WfhReportRecap::whereHas('team', fn ($q) => $q->whereIn('field_id', $fieldIds))
            ->with(['admin', 'team', 'kabid'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $recaps = $query->paginate(min($request->integer('per_page', 15), 100));

        return response()->json([
            'success' => true,
            'data' => WfhReportRecapResource::collection($recaps->items()),
            'meta' => [
                'current_page' => $recaps->currentPage(),
                'last_page' => $recaps->lastPage(),
                'total' => $recaps->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $fieldId = $user->team?->field?->id;

        if (! $fieldId && $user->hasRole('kepala_bidang')) {
            $fieldId = $user->headedFields?->first()?->id;
        }

        if (! $fieldId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terhubung dengan bidang manapun.',
            ], 422);
        }

        $validated = $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
        ]);

        // Verify team belongs to user's field
        $team = Team::findOrFail($validated['team_id']);
        if ($team->field_id !== $fieldId) {
            return response()->json([
                'success' => false,
                'message' => 'Tim tidak ditemukan dalam bidang Anda.',
            ], 403);
        }

        $recap = WfhReportRecap::create([
            'admin_id' => $user->id,
            'team_id' => $validated['team_id'],
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'status' => 'draft',
        ]);

        $recap->load(['admin', 'team', 'kabid']);

        return response()->json([
            'success' => true,
            'message' => 'Rekap laporan WFH berhasil dibuat.',
            'data' => new WfhReportRecapResource($recap),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $recap = WfhReportRecap::with(['admin', 'team.field', 'kabid'])->find($id);

        if (! $recap) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak ditemukan.',
            ], 404);
        }

        // Get individual reports within the period for this team
        $reports = WfhReport::whereHas('user', fn ($q) => $q->where('team_id', $recap->team_id))
            ->whereBetween('report_date', [$recap->period_start, $recap->period_end])
            ->with(['user', 'activities.links'])
            ->orderBy('report_date')
            ->orderBy('user_id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'recap' => new WfhReportRecapResource($recap),
                'reports' => $reports->map(fn ($r) => [
                    'id' => $r->id,
                    'user' => $r->user ? [
                        'id' => $r->user->id,
                        'name' => $r->user->name,
                        'nip' => $r->user->nip,
                        'position' => $r->user->position,
                    ] : null,
                    'report_date' => $r->report_date->format('Y-m-d'),
                    'status' => $r->status,
                    'activities' => $r->activities->map(fn ($a) => [
                        'id' => $a->id,
                        'start_time' => $a->start_time,
                        'end_time' => $a->end_time,
                        'activity' => $a->activity,
                        'links' => $a->links->pluck('url'),
                    ]),
                ]),
                'summary' => [
                    'total_reports' => $reports->count(),
                    'total_approved' => $reports->where('status', 'approved')->count(),
                    'total_pending' => $reports->where('status', 'pending')->count(),
                    'total_draft' => $reports->where('status', 'draft')->count(),
                    'total_rejected' => $reports->where('status', 'rejected')->count(),
                    'total_employees' => $reports->pluck('user_id')->unique()->count(),
                ],
            ],
        ]);
    }

    public function submit(int $id): JsonResponse
    {
        $recap = WfhReportRecap::with('team.field.head')->find($id);

        if (! $recap) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak ditemukan.',
            ], 404);
        }

        if ($recap->admin_id !== request()->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pembuat rekap yang dapat mengajukan.',
            ], 403);
        }

        if ($recap->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya rekap dengan status draft yang dapat diajukan.',
            ], 422);
        }

        // Auto-assign kepala bidang as kabid
        $head = $recap->team->field?->head;
        if (! $head) {
            return response()->json([
                'success' => false,
                'message' => 'Kepala bidang belum ditetapkan untuk bidang ini.',
            ], 422);
        }

        $recap->update([
            'status' => 'pending',
            'kabid_id' => $head->id,
        ]);

        $recap->load(['admin', 'team', 'kabid']);

        return response()->json([
            'success' => true,
            'message' => 'Rekap berhasil diajukan ke Kepala Bidang.',
            'data' => new WfhReportRecapResource($recap),
        ]);
    }

    public function approve(int $id): JsonResponse
    {
        $recap = WfhReportRecap::with('team.field.head')->find($id);

        if (! $recap) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak ditemukan.',
            ], 404);
        }

        if ($recap->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya rekap dengan status pending yang dapat disetujui.',
            ], 422);
        }

        $recap->update([
            'status' => 'approved',
            'kabid_signed_at' => now(),
        ]);

        $recap->load(['admin', 'team', 'kabid']);

        return response()->json([
            'success' => true,
            'message' => 'Rekap berhasil disetujui.',
            'data' => new WfhReportRecapResource($recap),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string'],
        ]);

        $recap = WfhReportRecap::with('team.field.head')->find($id);

        if (! $recap) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak ditemukan.',
            ], 404);
        }

        if ($recap->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya rekap dengan status pending yang dapat ditolak.',
            ], 422);
        }

        $recap->update([
            'status' => 'rejected',
            'reject_reason' => $validated['reason'],
        ]);

        $recap->load(['admin', 'team', 'kabid']);

        return response()->json([
            'success' => true,
            'message' => 'Rekap ditolak.',
            'data' => new WfhReportRecapResource($recap),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $recap = WfhReportRecap::find($id);

        if (! $recap) {
            return response()->json([
                'success' => false,
                'message' => 'Rekap tidak ditemukan.',
            ], 404);
        }

        if ($recap->admin_id !== request()->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pembuat rekap yang dapat menghapus.',
            ], 403);
        }

        if ($recap->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya rekap dengan status draft yang dapat dihapus.',
            ], 422);
        }

        $recap->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rekap berhasil dihapus.',
        ]);
    }
}
