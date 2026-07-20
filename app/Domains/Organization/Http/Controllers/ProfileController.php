<?php

namespace App\Domains\Organization\Http\Controllers;

use App\Domains\Organization\Http\Requests\ChangePasswordRequest;
use App\Domains\Organization\Http\Requests\UpdateProfileRequest;
use App\Domains\Organization\Http\Requests\UploadSignatureRequest;
use App\Support\Signature\SignatureServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ProfileController extends Controller
{
    public function __construct(
        private SignatureServiceInterface $signatureService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['team.field', 'team.leader']);

        return response()->json([
            'success' => true,
            'data' => $this->formatUser($user),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->only(['phone', 'position', 'rank']));

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $this->formatUser($user->fresh()->load(['team.field'])),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'password' => $request->input('password'),
            'must_change_password' => false,
        ]);

        // Revoke all other tokens so password rotation invalidates stale sessions.
        $current = $request->user()->currentAccessToken();
        $user->tokens()->where('id', '!=', $current->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui.',
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

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        $user = $request->user();
        $file = $request->file('photo');
        $path = $file->store('photos', 'public');

        $user->update(['photo_path' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diunggah.',
            'data' => [
                'photo_path' => $path,
                'photo_url' => asset("storage/{$path}"),
            ],
        ]);
    }

    private function formatUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'nip' => $user->nip,
            'email' => $user->email,
            'rank' => $user->rank,
            'position' => $user->position,
            'phone' => $user->phone,
            'signature_path' => $user->signature_path,
            'signature_url' => $user->signature_path
                ? asset("storage/{$user->signature_path}")
                : null,
            'photo_path' => $user->photo_path,
            'photo_url' => $user->photo_path
                ? asset("storage/{$user->photo_path}")
                : null,
            'is_active' => $user->is_active,
            'roles' => $user->getRoleNames(),
            'team' => $user->team ? [
                'id' => $user->team->id,
                'name' => $user->team->name,
                'field' => $user->team->field ? [
                    'id' => $user->team->field->id,
                    'name' => $user->team->field->name,
                ] : null,
            ] : null,
        ];
    }
}
