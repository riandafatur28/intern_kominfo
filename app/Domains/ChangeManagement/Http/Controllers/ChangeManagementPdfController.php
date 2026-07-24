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

    public function exportInitiation(int $id): Response|JsonResponse
    {
        $this->authorize('change.initiation.export_pdf');

        $initiation = $this->repo->findInitiationWithRelations($id);

        if (! $initiation) {
            return response()->json([
                'success' => false,
                'message' => 'Inisiasi tidak ditemukan.',
            ], 404);
        }

        if ($initiation->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'PDF hanya dapat di-generate untuk inisiasi yang sudah disetujui.',
            ], 422);
        }

        $initiator = $initiation->initiator;
        $reviewer = $initiation->reviewer;
        $field = $initiation->field;

        $initiatorSig = $this->resolveSignature($initiator?->signature_path);
        $reviewerSig = $this->resolveSignature($reviewer?->signature_path);

        $verifyUrl = $this->qrCodeService->generateVerificationUrl($initiation->verification_token);
        $qrSvg = $this->qrCodeService->generate($verifyUrl);

        $data = [
            'docNumber' => $initiation->doc_number,
            'tanggal' => $initiation->initiation_date->isoFormat('D MMMM Y'),
            'bidang' => $field?->name ?? '-',
            'neededByDate' => $initiation->needed_by_date?->isoFormat('D MMMM Y') ?? '-',
            'description' => $initiation->description,
            'reason' => $initiation->reason,
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

        $filename = "Initiation-{$initiation->id}-{$initiation->initiation_date->format('Y-m-d')}.pdf";

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportImplementation(int $id): Response|JsonResponse
    {
        $this->authorize('change.implementation.export_pdf');

        $impl = $this->repo->findImplementationWithRelations($id);

        if (! $impl) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        if ($impl->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'PDF hanya dapat di-generate untuk implementasi yang sudah selesai (diterima).',
            ], 422);
        }

        $initiation = $impl->initiation;
        $evaluator = $impl->evaluator;
        $reviewer = $impl->reviewer;
        $responsible = $impl->responsible;
        $field = $initiation?->field;

        $evaluatorSig = $this->resolveSignature($evaluator?->signature_path);
        $reviewerSig = $this->resolveSignature($reviewer?->signature_path);
        $responsibleSig = $this->resolveSignature($responsible?->signature_path);

        $data = [
            'docNumber' => $initiation?->doc_number ?? '-',
            'tanggal' => $initiation?->initiation_date?->isoFormat('D MMMM Y') ?? '-',
            'bidang' => $field?->name ?? '-',
            'description' => $initiation?->description ?? '-',
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

    public function exportImplementationFromPackage(int $packageId): Response|JsonResponse
    {
        $this->authorize('change.implementation.export_pdf');

        $package = $this->repo->findPackage($packageId);

        if (! $package || ! $package->implementation) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        return $this->exportImplementation($package->implementation->id);
    }

    private function resolveSignature(?string $path): string
    {
        if ($path) {
            $full = public_path('storage/'.$path);
            if (file_exists($full)) {
                return $full;
            }
        }

        return public_path('storage/signatures/test-sig-1.png');
    }
}
