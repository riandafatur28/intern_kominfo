<?php

namespace App\Domains\Auth\Http\Controllers;

use App\Domains\Auth\Concerns\FormatsUserPayload;
use App\Domains\Auth\Http\Requests\ChangePasswordRequest;
use App\Domains\Auth\Http\Requests\ForgotPasswordRequest;
use App\Domains\Auth\Http\Requests\LoginRequest;
use App\Domains\Auth\Http\Requests\ResetPasswordRequest;
use App\Domains\Auth\Http\Requests\VerifyOtpRequest;
use App\Domains\Auth\Services\PasswordResetService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use FormatsUserPayload;

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
        $user->load(['team.field', 'team.leader', 'roles.permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'user' => $this->formatUserPayload($user),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['team.field', 'team.leader', 'roles.permissions']);

        return response()->json([
            'success' => true,
            'data' => $this->formatUserPayload($user),
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

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->update([
            'password' => $request->new_password,
            'must_change_password' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah.',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request, PasswordResetService $service): JsonResponse
    {
        $service->sendOtp($request->email);

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, kode OTP telah dikirim ke email Anda.',
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request, PasswordResetService $service): JsonResponse
    {
        $resetToken = $service->verifyOtp($request->email, $request->code);

        if (! $resetToken) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid atau telah kedaluwarsa.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP terverifikasi. Gunakan reset_token untuk mengatur password baru.',
            'data' => ['reset_token' => $resetToken],
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request, PasswordResetService $service): JsonResponse
    {
        $success = $service->resetPassword($request->reset_token, $request->new_password);

        if (! $success) {
            return response()->json([
                'success' => false,
                'message' => 'Token reset tidak valid atau telah kedaluwarsa.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diatur. Silakan login.',
        ]);
    }
}
