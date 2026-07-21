<?php

namespace App\Domains\Wfh\Http\Controllers;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Models\Team;
use App\Support\Http\ResolvesFieldScope;
use App\Support\Pdf\PdfImageResolver;
use App\Support\Pdf\PdfRendererService;
use App\Support\QrCode\QrCodeService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;

class ReportPdfController extends Controller
{
    use AuthorizesRequests, ResolvesFieldScope;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
        private PdfRendererService $pdfRenderer,
        private QrCodeService $qrCodeService,
    ) {}

    public function export(int $id): Response|JsonResponse
    {
        $report = $this->wfhRepository->findReportWithRelations($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if (! in_array($report->status, ['pending', 'approved'])) {
            return response()->json([
                'success' => false,
                'message' => 'PDF hanya dapat di-generate untuk laporan yang sudah disubmit atau disetujui.',
            ], 422);
        }

        $isApproved = $report->status === 'approved';

        $user = $report->user;
        $supervisor = $report->supervisor;
        $team = $user->team;
        $field = $team?->field;

        // Build activity data with links
        $kegiatan = $report->activities->map(function ($activity) {
            return [
                'waktu' => $activity->start_time.' – '.$activity->end_time,
                'kegiatan' => $activity->activity,
                'links' => $activity->links->pluck('url')->toArray(),
            ];
        })->toArray();

        // QR code only available when approved (verification_token set at approve)
        $qrSvg = null;
        if ($isApproved && $report->verification_token) {
            $verifyUrl = $this->qrCodeService->generateVerificationUrl($report->verification_token);
            $qrSvg = $this->qrCodeService->generate($verifyUrl);
        }

        // Signature paths (absolute for dompdf)
        $makerSig = $user->signature_path
            ? public_path('storage/'.$user->signature_path)
            : null;

        // Supervisor signature only shown when approved
        $supervisorSig = null;
        if ($isApproved && $supervisor?->signature_path) {
            $supervisorSig = public_path('storage/'.$supervisor->signature_path);
        }

        // Use test signatures as fallback if user hasn't set one
        if (! $makerSig || ! file_exists($makerSig)) {
            $makerSig = public_path('storage/signatures/test-sig-1.png');
        }
        if ($isApproved && (! $supervisorSig || ! file_exists($supervisorSig))) {
            $supervisorSig = public_path('storage/signatures/test-sig-2.png');
        }

        $data = [
            'nama' => $user->name,
            'nip' => $user->nip,
            'pangkat' => $user->rank ?? '-',
            'jabatan' => $user->position ?? '-',
            'unitKerja' => $field?->name ?? '-',
            'tanggalPelaksanaan' => $report->report_date->isoFormat('D MMMM Y'),
            'kegiatan' => $kegiatan,
            'isApproved' => $isApproved,
            'signatureMakerPath' => $makerSig,
            'signatureSupervisorPath' => $supervisorSig,
            'makerName' => strtoupper($user->name),
            'makerNip' => $user->nip,
            'supervisorName' => $supervisor ? strtoupper($supervisor->name) : '-',
            'supervisorNip' => $supervisor?->nip ?? '-',
            'qrSvg' => $qrSvg,
        ];

        $pdf = $this->pdfRenderer->render('pdf.wfh-report', $data);

        $filename = "WFH-{$report->id}-{$report->report_date->format('Y-m-d')}.pdf";

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportTeam(Request $request, Team $team): Response|JsonResponse
    {
        $this->authorize('wfh.report.export_pdf');

        $admin = $request->user();
        $this->ensureTeamInAdminField($request, $team);
        $date = $request->input('date', now()->format('Y-m-d'));
        $reports = $this->wfhRepository->getTeamReportsForDate($team->id, $date);

        $team->load(['field.head']);
        $field = $team->field;
        $head = $field?->head;

        // Build staff data: name, nip, links
        $staff = $reports->map(function ($report) {
            $links = $report->activities->flatMap->links->pluck('url')->filter()->values();

            return [
                'name' => strtoupper($report->user->name),
                'nip' => $report->user->nip ?? '-',
                'links' => $links,
            ];
        })->values()->toArray();

        // Build attendance photo table — ALL team users (with/without attendance)
        $attendances = $this->wfhRepository->getTeamAttendancesForDate($team->id, $date);
        $attendanceMap = [];
        foreach ($attendances as $a) {
            $attendanceMap[$a->user_id][$a->session] = PdfImageResolver::resolve($a->photo_path);
        }

        // All team members (active)
        $teamUsers = $team->users()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'nip']);
        $staffPhotos = $teamUsers->map(function ($user) use ($attendanceMap) {
            return [
                'name' => strtoupper($user->name),
                'nip' => $user->nip ?? '-',
                'photos' => [
                    'pagi' => $attendanceMap[$user->id]['pagi'] ?? null,
                    'siang' => $attendanceMap[$user->id]['siang'] ?? null,
                    'sore' => $attendanceMap[$user->id]['sore'] ?? null,
                ],
            ];
        })->values()->toArray();
        // Admin (maker) signature
        $makerSig = $admin->signature_path
            ? public_path('storage/'.$admin->signature_path)
            : null;
        if (! $makerSig || ! file_exists($makerSig)) {
            $makerSig = public_path('storage/signatures/test-sig-1.png');
        }

        // KB (atasan langsung) signature
        $supervisorSig = null;
        if ($head?->signature_path) {
            $supervisorSig = public_path('storage/'.$head->signature_path);
        }
        if (! $supervisorSig || ! file_exists($supervisorSig)) {
            $supervisorSig = public_path('storage/signatures/test-sig-2.png');
        }

        $tanggal = Carbon::parse($date)->isoFormat('D MMMM Y');

        $data = [
            'namaTim' => $team->name,
            'unitKerja' => $field?->name ?? '-',
            'tanggalPelaksanaan' => $tanggal,
            'staff' => $staff,
            'staffPhotos' => $staffPhotos,
            'signatureMakerPath' => $makerSig,
            'signatureSupervisorPath' => $supervisorSig,
            'makerName' => strtoupper($admin->name),
            'makerNip' => $admin->nip,
            'supervisorName' => $head ? strtoupper($head->name) : '-',
            'supervisorNip' => $head?->nip ?? '-',
        ];

        $pdf = $this->pdfRenderer->render('pdf.wfh-report-admin', $data);

        $filename = "WFH-Team-{$team->id}-{$date}.pdf";

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
