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
        $result = $this->otpService->issue($request->email);

        if ($result['cooldown_remaining'] === null) {
            // Dispatch in both branches so response time is constant (anti-enumeration).
            // Real delivery only for registered users; the log mailer swallows the OTP
            // for unknown emails. Requires QUEUE_CONNECTION=database + a queue worker
            // in prod for true constant-time; under sync queue the SMTP-vs-log delta
            // is the residual timing signal.
            $mailable = new ResetPasswordOtpMail($result['code'], config('otp.expires_minutes'));
            $user
                ? Mail::to($user->email)->queue($mailable)
                : Mail::mailer('log')->to('otp-sink@local')->queue($mailable);
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

        $mailable = new ResetPasswordOtpMail($result['code'], config('otp.expires_minutes'));
        $user
            ? Mail::to($user->email)->queue($mailable)
            : Mail::mailer('log')->to('otp-sink@local')->queue($mailable);

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

        // verify() returned true → an OTP record exists for this email. If the user
        // doesn't (dummy OTP created by forgot() for anti-enumeration), there is
        // nothing to reset; return the same success response so existence isn't leaked.
        $user = User::where('email', $request->email)->first();
        if ($user) {
            $user->update([
                'password' => Hash::make($request->password),
                'must_change_password' => false,
            ]);

            // Revoke all existing tokens.
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset. Silakan login dengan password baru.',
        ]);
    }
}
