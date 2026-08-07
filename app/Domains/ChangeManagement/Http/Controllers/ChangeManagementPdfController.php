<?php

namespace App\Domains\ChangeManagement\Http\Controllers;

use App\Domains\ChangeManagement\Models\ChangeImplementation;
use App\Domains\ChangeManagement\Repositories\ChangeManagementRepositoryInterface;
use App\Support\Pdf\PdfRendererService;
use App\Support\QrCode\QrCodeService;
use App\Support\Signature\SignatureGuard;
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

        // PDF embeds real signatures; refuse export when any involved user
        // has not configured theirs yet.
        if ($missing = SignatureGuard::missing([
            $initiator,
            $reviewer,
        ])) {
            return response()->json(SignatureGuard::missingMessage($missing->name), 422);
        }

        $field = $package->field;

        // The template's single "Inisiator Perubahan" signature block is signed by the
        // kepala tim who reviewed/approved the package (their profile + signature) —
        // not the staf who typed the form. Mirrors dokumen inisiasi sistem.pdf.
        $signer = $package->reviewer;
        $signerSig = $this->resolveSignature($signer?->signature_path);

        $verifyUrl = $this->qrCodeService->generateVerificationUrl($package->verification_token);
        $qrSvg = $this->qrCodeService->generate($verifyUrl);

        $data = [
            'docNumber' => $package->doc_number,
            // DD-MM-YYYY — matches dokumen inisiasi/implementasi sistem.pdf's date format.
            'tanggal' => $package->initiation_date->format('d-m-Y'),
            'bidang' => $field?->name ?? '-',
            'neededByDate' => $package->needed_by_date?->format('d-m-Y') ?? '-',
            'description' => $package->description,
            'reason' => $package->reason,
            'initiatorName' => $signer ? strtoupper($signer->name) : '-',
            'initiatorNip' => $signer?->nip ?? '-',
            'initiatorPosition' => $signer?->position ?? '-',
            'initiatorSig' => $signerSig,
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

        // "Dievaluasi Oleh" is whoever was logged in when the form was submitted (the
        // initiator/staf) — evaluator_id is stamped at submit(), but fall back to the
        // initiator directly for older records saved before that stamping existed.
        $evaluator = $impl->evaluator ?? $package->initiator;
        $reviewer = $impl->reviewer;
        $responsible = $impl->responsible;
        $field = $package->field;

        // PDF embeds real signatures; refuse export when any involved user
        // has not configured theirs yet.
        if ($missing = SignatureGuard::missing([
            $evaluator,
            $reviewer,
            $responsible,
        ])) {
            return response()->json(SignatureGuard::missingMessage($missing->name), 422);
        }
        $evaluatorSig = $this->resolveSignature($evaluator?->signature_path);
        $reviewerSig = $this->resolveSignature($reviewer?->signature_path);

        $responsibleSig = $this->resolveSignature($responsible?->signature_path);
        $data = [
            'docNumber' => $package->doc_number ?? '-',
            'tanggal' => $package->initiation_date?->format('d-m-Y') ?? '-',
            'bidang' => $field?->name ?? '-',
            'description' => $package->description ?? '-',
            // Raw keys (not pre-formatted labels) — the template renders these as a
            // checkbox list of all options (Low/Medium/High/...), same as Tipe
            // Perubahan, and needs the selected key to mark the right one.
            'priority' => $impl->priority ?? 'low',
            'impact' => $impl->impact ?? 'low',
            'productionImpact' => $impl->production_impact ?? '-',
            'requiredEffort' => $impl->required_effort ?? '-',
            'costNeeded' => $impl->cost_needed ? 'Ada' : 'Tidak',
            'costAmount' => $impl->cost_amount ? 'Rp. '.$impl->cost_amount : '-',
            'resources' => $impl->resources ?? '-',
            'testPlan' => $impl->test_plan ?? '-',
            'changeTypeNames' => $impl->changeTypes->pluck('name')->all(),
            'reviewStatus' => $impl->review_status ?? '-',
            'reviewResponse' => $impl->review_response ?? '-',
            'executionDate' => $impl->execution_date?->format('d-m-Y') ?? '-',
            // Fixed per spec — the responsible party is always "Tim Aplikasi", regardless
            // of which kepala tim account approved.
            'responsibleTeamName' => 'Tim Aplikasi',
            // "Hasil Tanggapan Perubahan" mirrors the "Tanggapan" field — there is no
            // separate input for it in the web form.
            'implementationResult' => $impl->review_response ?? '-',
            'attachmentImages' => $this->resolveAttachmentImages($impl),
            'releaseDate' => $impl->release_date?->format('d-m-Y') ?? '-',
            'evaluatorName' => $evaluator ? strtoupper($evaluator->name) : '-',
            'evaluatorNip' => $evaluator?->nip ?? '-',
            'evaluatorPosition' => $evaluator?->position ?? '-',
            'evaluatorBidang' => $evaluator?->team?->field?->name ?? $field?->name ?? '-',
            'evaluatorSig' => $evaluatorSig,
            'reviewerName' => $reviewer ? strtoupper($reviewer->name) : '-',
            'reviewerNip' => $reviewer?->nip ?? '-',
            'reviewerPosition' => $reviewer?->position ?? '-',
            'reviewerBidang' => $reviewer?->team?->field?->name ?? $field?->name ?? '-',
            'reviewerSig' => $reviewerSig,
            'responsibleName' => $responsible ? strtoupper($responsible->name) : '-',
            'responsibleNip' => $responsible?->nip ?? '-',
            'responsiblePosition' => $responsible?->position ?? '-',
            'responsibleBidang' => $responsible?->team?->field?->name ?? $field?->name ?? '-',
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
        return $path ? $this->fileDataUri($path, 'image/png') : '';
    }

    /** @return list<string> base64 data URIs of the implementation attachments (images only). */
    private function resolveAttachmentImages(ChangeImplementation $impl): array
    {
        $images = [];

        foreach ($impl->attachments as $attachment) {
            $mime = match (strtolower(pathinfo($attachment->path, PATHINFO_EXTENSION))) {
                'png' => 'image/png',
                'jpg', 'jpeg' => 'image/jpeg',
                default => null,
            };

            if ($mime !== null && ($uri = $this->fileDataUri($attachment->path, $mime)) !== '') {
                $images[] = $uri;
            }
        }

        return $images;
    }

    private function fileDataUri(string $path, string $mime): string
    {
        $full = public_path('storage/'.$path);
        if (! is_file($full)) {
            return '';
        }

        return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($full));
    }
}
