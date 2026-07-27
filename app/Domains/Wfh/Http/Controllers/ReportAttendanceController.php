<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Http\Requests\AppendAttendanceRequest;
use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Domains\Wfh\Services\WfhReportStateMachine;
use App\Models\Setting;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ReportAttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
        private WfhReportStateMachine $stateMachine,
    ) {}

    public function store(WfhReport $report, AppendAttendanceRequest $request): JsonResponse
    {
        if ($block = $this->authorizeEdit($report, $request)) {
            return $block;
        }

        $user = $request->user();
        $today = now()->toDateString();

        // Guard: report_date must be today
        if ($report->report_date->format('Y-m-d') !== $today) {
            return response()->json([
                'success' => false,
                'message' => 'Absensi hanya dapat dilakukan pada hari ini.',
            ], 422);
        }

        $date = $report->report_date->format('Y-m-d');
        $session = $request->input('session');

        // Validate allowed day from Setting
        $allowedDays = Setting::get('wfh_allowed_days', [1, 2, 3, 4, 5]);
        $dayOfWeek = now()->parse($date)->dayOfWeekIso;

        if (! in_array($dayOfWeek, $allowedDays)) {
            return response()->json([
                'success' => false,
                'message' => 'Absensi WFH hanya dapat dilakukan pada hari yang ditentukan.',
            ], 422);
        }

        // Guard: no duplicate session for same user+date
        $existing = $this->wfhRepository->findAttendanceByUserAndDate($user->id, $date, $session);
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah melakukan absensi untuk sesi ini.',
            ], 422);
        }

        // Store photo
        $photo = $request->file('photo');
        $path = $photo->store("attendances/{$user->id}/{$date}", 'public');

        $attendance = $this->wfhRepository->addAttendanceToReport($report, [
            'session' => $session,
            'photo_path' => $path,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absensi WFH berhasil.',
            'data' => [
                'id' => $attendance->id,
                'date' => $attendance->date->format('Y-m-d'),
                'session' => $attendance->session,
                'photo_url' => asset("storage/{$path}"),
                'check_in_at' => $attendance->check_in_at,
            ],
        ], 201);
    }

    public function destroy(WfhReport $report, WfhAttendance $attendance, Request $request): JsonResponse
    {
        if ($attendance->report_id !== $report->id) {
            return $this->notFound('Absensi tidak ditemukan.');
        }

        if ($block = $this->authorizeEdit($report, $request)) {
            return $block;
        }

        $this->wfhRepository->deleteAttendance($attendance->id);

        return response()->json([
            'success' => true,
            'message' => 'Absensi berhasil dihapus.',
        ]);
    }

    private function authorizeEdit(WfhReport $report, Request $request): ?JsonResponse
    {
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

        return null;
    }

    private function notFound(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }
}
