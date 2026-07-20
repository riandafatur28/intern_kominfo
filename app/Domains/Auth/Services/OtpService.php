<?php

namespace App\Domains\Auth\Services;

use App\Domains\Auth\Models\PasswordResetOtp;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    /**
     * Issue a new OTP for the given email.
     *
     * @return array{code: string, expires_at: Carbon, cooldown_remaining: ?int}
     */
    public function issue(string $email): array
    {
        // Check cooldown
        $existing = PasswordResetOtp::where('email', $email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            $elapsed = abs($existing->created_at->diffInSeconds(now()));
            $cooldownSeconds = config('otp.cooldown_seconds');

            if ($elapsed < $cooldownSeconds) {
                $remaining = $cooldownSeconds - $elapsed;
                return [
                    'code' => '',
                    'expires_at' => $existing->expires_at,
                    'cooldown_remaining' => $remaining,
                ];
            }

            // Expire old OTP so we can issue a new one
            $existing->update(['used_at' => now()]);
        }

        // Generate OTP
        $code = $this->generateCode();
        $expiresAt = Carbon::now()->addMinutes(config('otp.expires_minutes'));

        PasswordResetOtp::create([
            'email' => $email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => $expiresAt,
        ]);

        return [
            'code' => $code,
            'expires_at' => $expiresAt,
            'cooldown_remaining' => null,
        ];
    }

    /**
     * Verify an OTP code for the given email.
     */
    public function verify(string $email, string $code): bool
    {
        $otp = PasswordResetOtp::where('email', $email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otp) {
            return false;
        }

        if ($otp->isExhausted()) {
            $otp->update(['used_at' => now()]);
            return false;
        }

        if (! Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');
            return false;
        }

        // Success — mark used
        $otp->update(['used_at' => now()]);
        return true;
    }

    /**
     * Delete all expired and used OTP records.
     */
    public function purgeExpired(): int
    {
        return PasswordResetOtp::where(function ($q) {
            $q->where('expires_at', '<=', now())
                ->orWhereNotNull('used_at');
        })->delete();
    }

    /**
     * Generate a cryptographically secure random numeric code.
     */
    private function generateCode(): string
    {
        $length = config('otp.length');
        $code = '';

        for ($i = 0; $i < $length; $i++) {
            $code .= random_int(0, 9);
        }

        return $code;
    }
}
