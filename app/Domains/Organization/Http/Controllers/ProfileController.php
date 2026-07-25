<?php

namespace App\Domains\Organization\Http\Controllers;

use App\Domains\Auth\Concerns\FormatsUserPayload;
use App\Domains\Organization\Http\Requests\UpdateProfileRequest;
use App\Domains\Organization\Http\Requests\UploadSignatureRequest;
use App\Support\Signature\SignatureServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ProfileController extends Controller
{
    use FormatsUserPayload;

    public function __construct(
        private SignatureServiceInterface $signatureService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['team.field', 'team.leader', 'roles.permissions']);

        return response()->json([
            'success' => true,
            'data' => $this->formatUserPayload($user),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->only(['phone', 'position', 'rank']));

        $fresh = $user->fresh();
        $fresh->load(['team.field', 'team.leader', 'roles.permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $this->formatUserPayload($fresh),
        ]);
    }

    public function uploadSignature(UploadSignatureRequest $request): JsonResponse
    {
        $user = $request->user();
        $file = $request->file('signature');

        $path = $this->signatureService->normalize(
            $file->getRealPath(),
            $user->id,
        );

        $user->update(['signature_path' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Tanda tangan berhasil diunggah.',
            'data' => [
                'signature_path' => $path,
                'signature_url' => asset("storage/{$path}"),
            ],
        ]);
    }
}
