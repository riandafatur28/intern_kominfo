<?php

namespace App\Domains\Auth\Http\Controllers;

use App\Domains\Auth\Http\Requests\ForgotPasswordRequest;
use App\Domains\Auth\Http\Requests\ResetPasswordRequest;
use App\Domains\Auth\Mail\ResetPasswordOtpMail;
use App\Domains\Auth\Services\OtpService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class PasswordResetController extends Controller
{
    public function __construct(
        private OtpService $otpService,
    ) {}

    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if ($user) {
            $result = $this->otpService->issue($user->email);

            if ($result['cooldown_remaining'] === null) {
                Mail::to($user->email)->send(
                    new ResetPasswordOtpMail($result['code'], config('otp.expires_minutes'))
                );
            }
        } else {
            // Still generate OTP to prevent timing-based enumeration
            $this->otpService->issue($request->email);
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, kode OTP telah dikirim.',
        ]);
    }

    public function resend(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        $result = $this->otpService->issue($request->email);

        if ($result['cooldown_remaining'] !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP sudah dikirim. Silakan coba lagi nanti.',
            ], 429);
        }

        if ($user) {
            Mail::to($user->email)->send(
                new ResetPasswordOtpMail($result['code'], config('otp.expires_minutes'))
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, kode OTP telah dikirim.',
        ]);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $verified = $this->otpService->verify($request->email, $request->code);

        if (! $verified) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid atau sudah kadaluarsa.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak terdaftar.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'must_change_password' => false,
        ]);

        // Revoke all existing tokens
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset. Silakan login dengan password baru.',
        ]);
    }
}
