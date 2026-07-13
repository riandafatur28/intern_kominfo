<?php

namespace App\Domains\ChangeManagement\Http\Controllers;

use App\Domains\ChangeManagement\Http\Requests\StoreInitiationRequest;
use App\Domains\ChangeManagement\Http\Resources\InitiationResource;
use App\Domains\ChangeManagement\Repositories\ChangeManagementRepositoryInterface;
use App\Domains\ChangeManagement\Services\DocNumberGenerator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class InitiationController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private ChangeManagementRepositoryInterface $repo,
        private DocNumberGenerator $docNumberGenerator,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);
        $filters = $request->only(['status', 'field_id']);

        $initiations = $this->repo->paginateInitiations($perPage, $filters);

        return response()->json([
            'success' => true,
            'data' => InitiationResource::collection($initiations->items()),
            'meta' => [
                'current_page' => $initiations->currentPage(),
                'last_page' => $initiations->lastPage(),
                'total' => $initiations->total(),
            ],
        ]);
    }

    public function store(StoreInitiationRequest $request): JsonResponse
    {
        $this->authorize('change.initiation.create');

        $docNumber = $this->docNumberGenerator->generate();

        $initiation = $this->repo->createInitiation([
            'field_id' => $request->input('field_id'),
            'initiator_id' => $request->user()->id,
            'doc_number' => $docNumber,
            'initiation_date' => now()->toDateString(),
            'needed_by_date' => $request->input('needed_by_date'),
            'description' => $request->input('description'),
            'reason' => $request->input('reason'),
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Inisiasi perubahan berhasil dibuat.',
            'data' => new InitiationResource($initiation),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $initiation = $this->repo->findInitiationWithRelations($id);

        if (! $initiation) {
            return response()->json([
                'success' => false,
                'message' => 'Inisiasi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new InitiationResource($initiation),
        ]);
    }

    public function submit(Request $request, int $id): JsonResponse
    {
        $initiation = $this->repo->find($id);

        if (! $initiation) {
            return response()->json([
                'success' => false,
                'message' => 'Inisiasi tidak ditemukan.',
            ], 404);
        }

        if ($initiation->initiator_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya inisiator yang dapat mensubmit.',
            ], 403);
        }

        if ($initiation->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya inisiasi dengan status draft yang dapat disubmit.',
            ], 422);
        }

        $this->repo->update($id, [
            'status' => 'pending',
            'initiator_signed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Inisiasi berhasil disubmit untuk persetujuan.',
            'data' => new InitiationResource($this->repo->findInitiationWithRelations($id)),
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $this->authorize('change.initiation.approve');

        $initiation = $this->repo->find($id);

        if (! $initiation) {
            return response()->json([
                'success' => false,
                'message' => 'Inisiasi tidak ditemukan.',
            ], 404);
        }

        if ($initiation->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya inisiasi dengan status pending yang dapat disetujui.',
            ], 422);
        }

        $this->repo->update($id, [
            'status' => 'approved',
            'review_status' => 'approved',
            'reviewer_id' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Inisiasi berhasil disetujui.',
            'data' => new InitiationResource($this->repo->findInitiationWithRelations($id)),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $this->authorize('change.initiation.reject');

        $request->validate(['reason' => 'required|string']);

        $initiation = $this->repo->find($id);

        if (! $initiation) {
            return response()->json([
                'success' => false,
                'message' => 'Inisiasi tidak ditemukan.',
            ], 404);
        }

        if ($initiation->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya inisiasi dengan status pending yang dapat ditolak.',
            ], 422);
        }

        $this->repo->update($id, [
            'status' => 'rejected',
            'review_status' => 'rejected',
            'reviewer_id' => $request->user()->id,
            'reviewed_at' => now(),
            'review_reason' => $request->input('reason'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Inisiasi ditolak.',
            'data' => new InitiationResource($this->repo->findInitiationWithRelations($id)),
        ]);
    }
}
