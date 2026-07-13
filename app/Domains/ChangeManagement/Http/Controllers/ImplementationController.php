<?php

namespace App\Domains\ChangeManagement\Http\Controllers;

use App\Domains\ChangeManagement\Http\Requests\StoreImplementationRequest;
use App\Domains\ChangeManagement\Http\Resources\ImplementationResource;
use App\Domains\ChangeManagement\Repositories\ChangeManagementRepositoryInterface;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ImplementationController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private ChangeManagementRepositoryInterface $repo,
    ) {}

    public function store(StoreImplementationRequest $request, int $initiationId): JsonResponse
    {
        $this->authorize('change.implementation.create');

        $initiation = $this->repo->find($initiationId);

        if (! $initiation) {
            return response()->json([
                'success' => false,
                'message' => 'Inisiasi tidak ditemukan.',
            ], 404);
        }

        if ($initiation->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi hanya dapat dibuat dari inisiasi yang sudah disetujui.',
            ], 422);
        }

        $data = $request->only([
            'priority', 'impact', 'production_impact', 'required_effort',
            'cost_needed', 'cost_amount', 'resources', 'test_plan',
            'implementation_result', 'testing_result',
        ]);
        $data['evaluator_id'] = $request->user()->id;
        $data['status'] = 'draft';

        $impl = $this->repo->createImplementation(
            initiationId: $initiationId,
            data: $data,
            typeIds: $request->input('change_type_ids', []),
        );

        return response()->json([
            'success' => true,
            'message' => 'Implementasi perubahan berhasil dibuat.',
            'data' => new ImplementationResource($impl->load(['changeTypes', 'initiation'])),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $impl = $this->repo->findImplementationWithRelations($id);

        if (! $impl) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ImplementationResource($impl),
        ]);
    }

    public function update(StoreImplementationRequest $request, int $id): JsonResponse
    {
        $this->authorize('change.implementation.update');

        $impl = $this->repo->findImplementationWithRelations($id);

        if (! $impl) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        if (! in_array($impl->status, ['draft', 'revision'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya implementasi dengan status draft atau revision yang dapat diubah.',
            ], 422);
        }

        $data = $request->only([
            'priority', 'impact', 'production_impact', 'required_effort',
            'cost_needed', 'cost_amount', 'resources', 'test_plan',
            'implementation_result', 'testing_result',
        ]);

        $this->repo->updateImplementation(
            id: $id,
            data: $data,
            typeIds: $request->input('change_type_ids', []),
        );

        return response()->json([
            'success' => true,
            'message' => 'Implementasi perubahan berhasil diperbarui.',
            'data' => new ImplementationResource($this->repo->findImplementationWithRelations($id)),
        ]);
    }

    public function uploadAttachments(Request $request, int $id): JsonResponse
    {
        $this->authorize('change.implementation.update');

        $request->validate([
            'files' => ['required', 'array'],
            'files.*' => ['image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $impl = $this->repo->findImplementationWithRelations($id);

        if (! $impl) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        $paths = [];
        foreach ($request->file('files') as $file) {
            $paths[] = $file->store("change-attachments/{$id}", 'public');
        }

        $this->repo->addAttachments($id, $paths);

        return response()->json([
            'success' => true,
            'message' => count($paths) . ' file berhasil diunggah.',
            'data' => new ImplementationResource($this->repo->findImplementationWithRelations($id)),
        ]);
    }

    public function submit(Request $request, int $id): JsonResponse
    {
        $impl = $this->repo->findImplementationWithRelations($id);

        if (! $impl) {
            return response()->json([
                'success' => false,
                'message' => 'Implementasi tidak ditemukan.',
            ], 404);
        }

        if (! in_array($impl->status, ['draft', 'revision'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya implementasi draft/revision yang dapat disubmit.',
            ], 422);
        }

        $this->repo->submitImplementation($id, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Implementasi berhasil disubmit untuk review.',
            'data' => new ImplementationResource($this->repo->findImplementationWithRelations($id)),
        ]);
    }
}
