<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Support\Pdf\PdfRendererService;
use App\Support\QrCode\QrCodeService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class ReportPdfController extends Controller
{
    use AuthorizesRequests;

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

        if ($report->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'PDF hanya dapat di-generate untuk laporan yang sudah disetujui.',
            ], 422);
        }

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

        // Generate QR code with stored verification token
        $verifyUrl = $this->qrCodeService->generateVerificationUrl($report->verification_token);
        $qrSvg = $this->qrCodeService->generate($verifyUrl);

        // Signature paths (absolute for dompdf)
        $makerSig = $user->signature_path
            ? public_path('storage/'.$user->signature_path)
            : null;
        $supervisorSig = $supervisor?->signature_path
            ? public_path('storage/'.$supervisor->signature_path)
            : null;

        // Use test signatures as fallback if user hasn't set one
        if (! $makerSig || ! file_exists($makerSig)) {
            $makerSig = public_path('storage/signatures/test-sig-1.png');
        }
        if (! $supervisorSig || ! file_exists($supervisorSig)) {
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
}
