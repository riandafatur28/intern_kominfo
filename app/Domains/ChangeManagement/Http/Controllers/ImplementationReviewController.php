<?php

namespace App\Domains\ChangeManagement\Http\Controllers;

use App\Domains\ChangeManagement\Http\Requests\ReviewImplementationRequest;
use App\Domains\ChangeManagement\Http\Resources\ImplementationResource;
use App\Domains\ChangeManagement\Models\ChangeImplementation;
use App\Domains\ChangeManagement\Repositories\ChangeManagementRepositoryInterface;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class ImplementationReviewController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private ChangeManagementRepositoryInterface $repo,
    ) {}

    public function review(ReviewImplementationRequest $request, int $id): JsonResponse
    {
        $this->authorize('change.implementation.review');

        $impl = $this->repo->findImplementationWithRelations($id);

        if (! $impl) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        if ($impl->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya implementasi yang sudah disubmit yang dapat direview.',
            ], 422);
        }

        $reviewStatus = $request->input('review_status');
        $userId = $request->user()->id;
        $now = now();

        if ($reviewStatus === 'diterima') {
            // 1 action: reviewer = responsible = same kepala tim
            ChangeImplementation::where('id', $id)->update([
                'review_status' => 'diterima',
                'review_response' => $request->input('review_response'),
                'execution_date' => $request->input('execution_date'),
                'release_date' => $request->input('release_date'),
                'implementation_result' => $request->input('implementation_result'),
                'testing_result' => $request->input('testing_result'),
                'reviewer_id' => $userId,
                'reviewer_signed_at' => $now,
                'responsible_id' => $userId,
                'responsible_signed_at' => $now,
                'status' => 'completed',
            ]);
        } elseif ($reviewStatus === 'ditolak') {
            ChangeImplementation::where('id', $id)->update([
                'review_status' => 'ditolak',
                'review_response' => $request->input('review_response'),
                'reviewer_id' => $userId,
                'status' => 'rejected',
            ]);
        } else {
            // revisi
            ChangeImplementation::where('id', $id)->update([
                'review_status' => 'revisi',
                'review_response' => $request->input('review_response'),
                'reviewer_id' => $userId,
                'status' => 'revision',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Review berhasil: {$reviewStatus}.",
            'data' => new ImplementationResource($this->repo->findImplementationWithRelations($id)),
        ]);
    }
}
