<?php

namespace App\Domains\Auth\Http\Controllers;

use App\Domains\Auth\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        // Always perform a hash comparison to prevent timing-based email enumeration
        $hashToCheck = $user?->password ?? '$2y$12$'.str_repeat('a', 53);
        $passwordValid = Hash::check($request->password, $hashToCheck);

        if (! $user || ! $passwordValid) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak aktif. Hubungi administrator.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'user' => $this->userData($user),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['team.field', 'roles.permissions']);

        return response()->json([
            'success' => true,
            'data' => $this->userData($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    private function userData(User $user): array
    {
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'nip' => $user->nip,
            'email' => $user->email,
            'rank' => $user->rank,
            'position' => $user->position,
            'phone' => $user->phone,
            'signature_path' => $user->signature_path,
            'photo_path' => $user->photo_path,
            'photo_url' => $user->photo_path
                ? asset("storage/{$user->photo_path}")
                : null,
            'is_active' => $user->is_active,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ];

        if ($user->relationLoaded('team') && $user->team) {
            $team = [
                'id' => $user->team->id,
                'name' => $user->team->name,
            ];

            if ($user->team->leader) {
                $team['leader'] = [
                    'id' => $user->team->leader->id,
                    'name' => $user->team->leader->name,
                ];
            }

            if ($user->team->field) {
                $team['field'] = [
                    'id' => $user->team->field->id,
                    'name' => $user->team->field->name,
                ];
            }

            $data['team'] = $team;
        }

        return $data;
    }
}
