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
        // Find any prior row for this email (active, expired, or used).
        // Cooldown applies only to a still-active record.
        $existing = PasswordResetOtp::where('email', $email)->first();

        if ($existing && $existing->used_at === null && $existing->expires_at->isFuture()) {
            $elapsed = abs($existing->created_at->diffInSeconds(now()));
            $cooldownSeconds = config('otp.cooldown_seconds');

            if ($elapsed < $cooldownSeconds) {
                return [
                    'code' => '',
                    'expires_at' => $existing->expires_at,
                    'cooldown_remaining' => $cooldownSeconds - $elapsed,
                ];
            }
        }

        // Generate a fresh OTP and upsert on the unique(email) key. This handles
        // first-issue, post-cooldown, post-expiry, and post-use re-issue without
        // tripping the unique constraint.
        $code = $this->generateCode();
        $expiresAt = Carbon::now()->addMinutes(config('otp.expires_minutes'));

        PasswordResetOtp::updateOrCreate(
            ['email' => $email],
            [
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => $expiresAt,
                'used_at' => null,
                // Reset created_at so the next cooldown window starts fresh.
                'created_at' => now(),
            ],
        );

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
