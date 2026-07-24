<?php

namespace App\Domains\ChangeManagement\Http\Controllers;

use App\Domains\ChangeManagement\Repositories\ChangeManagementRepositoryInterface;
use App\Support\Pdf\PdfRendererService;
use App\Support\QrCode\QrCodeService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class ChangeManagementPdfController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private ChangeManagementRepositoryInterface $repo,
        private PdfRendererService $pdfRenderer,
        private QrCodeService $qrCodeService,
    ) {}

    public function exportInitiation(int $packageId): Response|JsonResponse
    {
        $this->authorize('change.initiation.export_pdf');

        $package = $this->repo->findPackage($packageId);

        if (! $package) {
            return response()->json([
                'success' => false,
                'message' => 'Paket perubahan tidak ditemukan.',
            ], 404);
        }

        if ($package->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'PDF hanya dapat di-generate untuk paket yang sudah disetujui.',
            ], 422);
        }

        $initiator = $package->initiator;
        $reviewer = $package->reviewer;
        $field = $package->field;

        $initiatorSig = $this->resolveSignature($initiator?->signature_path);
        $reviewerSig = $this->resolveSignature($reviewer?->signature_path);

        $verifyUrl = $this->qrCodeService->generateVerificationUrl($package->verification_token);
        $qrSvg = $this->qrCodeService->generate($verifyUrl);

        $data = [
            'docNumber' => $package->doc_number,
            'tanggal' => $package->initiation_date->isoFormat('D MMMM Y'),
            'bidang' => $field?->name ?? '-',
            'neededByDate' => $package->needed_by_date?->isoFormat('D MMMM Y') ?? '-',
            'description' => $package->description,
            'reason' => $package->reason,
            'initiatorName' => strtoupper($initiator?->name ?? '-'),
            'initiatorNip' => $initiator?->nip ?? '-',
            'initiatorPosition' => $initiator?->position ?? '-',
            'initiatorSig' => $initiatorSig,
            'reviewerName' => $reviewer ? strtoupper($reviewer->name) : '-',
            'reviewerNip' => $reviewer?->nip ?? '-',
            'reviewerPosition' => $reviewer?->position ?? '-',
            'reviewerSig' => $reviewerSig,
            'qrSvg' => $qrSvg,
        ];

        $pdf = $this->pdfRenderer->render('pdf.change-initiation', $data);

        $filename = "Initiation-{$package->id}-{$package->initiation_date->format('Y-m-d')}.pdf";

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportImplementation(int $packageId): Response|JsonResponse
    {
        $this->authorize('change.implementation.export_pdf');

        $package = $this->repo->findPackage($packageId);

        if (! $package || ! $package->implementation) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        $impl = $package->implementation;

        if ($impl->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'PDF hanya dapat di-generate untuk implementasi yang sudah selesai (diterima).',
            ], 422);
        }

        $evaluator = $impl->evaluator;
        $reviewer = $impl->reviewer;
        $responsible = $impl->responsible;
        $field = $package->field;

        $evaluatorSig = $this->resolveSignature($evaluator?->signature_path);
        $reviewerSig = $this->resolveSignature($reviewer?->signature_path);
        $responsibleSig = $this->resolveSignature($responsible?->signature_path);

        $data = [
            'docNumber' => $package->doc_number ?? '-',
            'tanggal' => $package->initiation_date?->isoFormat('D MMMM Y') ?? '-',
            'bidang' => $field?->name ?? '-',
            'description' => $package->description ?? '-',
            'priority' => $impl->priority ?? '-',
            'impact' => $impl->impact ?? '-',
            'productionImpact' => $impl->production_impact ?? '-',
            'requiredEffort' => $impl->required_effort ?? '-',
            'costNeeded' => $impl->cost_needed ? 'Ada' : 'Tidak',
            'costAmount' => $impl->cost_amount ? 'Rp. '.$impl->cost_amount : '-',
            'resources' => $impl->resources ?? '-',
            'testPlan' => $impl->test_plan ?? '-',
            'changeTypes' => $impl->changeTypes->pluck('name')->implode(', '),
            'reviewStatus' => $impl->review_status ?? '-',
            'reviewResponse' => $impl->review_response ?? '-',
            'executionDate' => $impl->execution_date?->isoFormat('D MMMM Y') ?? '-',
            'implementationResult' => $impl->implementation_result ?? '-',
            'testingResult' => $impl->testing_result ?? '-',
            'releaseDate' => $impl->release_date?->isoFormat('D MMMM Y') ?? '-',
            'evaluatorName' => $evaluator ? strtoupper($evaluator->name) : '-',
            'evaluatorNip' => $evaluator?->nip ?? '-',
            'evaluatorPosition' => $evaluator?->position ?? '-',
            'evaluatorSig' => $evaluatorSig,
            'reviewerName' => $reviewer ? strtoupper($reviewer->name) : '-',
            'reviewerNip' => $reviewer?->nip ?? '-',
            'reviewerPosition' => $reviewer?->position ?? '-',
            'reviewerSig' => $reviewerSig,
            'responsibleName' => $responsible ? strtoupper($responsible->name) : '-',
            'responsibleNip' => $responsible?->nip ?? '-',
            'responsiblePosition' => $responsible?->position ?? '-',
            'responsibleSig' => $responsibleSig,
        ];

        $pdf = $this->pdfRenderer->render('pdf.change-implementation', $data);

        $filename = "Implementation-{$impl->id}.pdf";

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function resolveSignature(?string $path): string
    {
        if ($path) {
            $full = public_path('storage/'.$path);
            if (file_exists($full)) {
                return 'data:image/png;base64,'.base64_encode((string) file_get_contents($full));
            }
        }

        return '';
    }
}
