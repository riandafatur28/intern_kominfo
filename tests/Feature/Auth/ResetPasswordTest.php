<?php

namespace Tests\Feature\Auth;

use App\Domains\Auth\Models\PasswordResetOtp;
use App\Models\User;
use App\Notifications\ResetPasswordOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use ReflectionProperty;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        Notification::fake();
        // Disable throttle so multi-request flows (cooldown, lockout) are not
        // blocked by the 5/min rate limiter. Throttle behavior is validated
        // separately via the rate-limiter definition, not here.
        $this->withoutMiddleware([ThrottleRequests::class]);
    }

    // ── forgot-password ──

    public function test_forgot_password_sends_otp_for_registered_active_user(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Jika email terdaftar, kode OTP telah dikirim ke email Anda.');

        $this->assertDatabaseHas('password_reset_otps', ['email' => $user->email]);
        Notification::assertSentTo($user, ResetPasswordOtpNotification::class);
    }

    public function test_forgot_password_returns_generic_for_unregistered_email(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Jika email terdaftar, kode OTP telah dikirim ke email Anda.');

        $this->assertDatabaseMissing('password_reset_otps', ['email' => 'nobody@example.com']);
        Notification::assertNothingSent();
    }

    public function test_forgot_password_silent_for_inactive_user(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('password_reset_otps', ['email' => $user->email]);
        Notification::assertNothingSent();
    }

    public function test_forgot_password_resend_cooldown_60s(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email]);
        $otp = PasswordResetOtp::find($user->email);
        $lastSent = $otp->last_sent_at;

        // Immediate second request — within 60s cooldown, no new OTP
        $this->postJson('/api/auth/forgot-password', ['email' => $user->email]);

        $otp->refresh();
        $this->assertEquals($lastSent->timestamp, $otp->last_sent_at->timestamp);
        Notification::assertSentToTimes($user, ResetPasswordOtpNotification::class, 1);
    }

    public function test_forgot_password_validates_email_format(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // ── verify-otp ──

    public function test_verify_otp_returns_reset_token(): void
    {
        $user = User::factory()->create();
        $code = '123456';
        PasswordResetOtp::factory()->create([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
        ]);

        $this->postJson('/api/auth/verify-otp', ['email' => $user->email, 'code' => $code])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['reset_token']]);
    }

    public function test_verify_otp_rejects_expired(): void
    {
        $user = User::factory()->create();
        PasswordResetOtp::factory()->expired()->create([
            'email' => $user->email,
            'code_hash' => Hash::make('123456'),
        ]);

        $this->postJson('/api/auth/verify-otp', ['email' => $user->email, 'code' => '123456'])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Kode OTP tidak valid atau telah kedaluwarsa.');
    }

    public function test_verify_otp_rejects_reuse(): void
    {
        $user = User::factory()->create();
        $code = '123456';
        PasswordResetOtp::factory()->create([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
        ]);

        // First verify succeeds
        $this->postJson('/api/auth/verify-otp', ['email' => $user->email, 'code' => $code])
            ->assertStatus(200);

        // Second verify with same code rejected (used_at set)
        $this->postJson('/api/auth/verify-otp', ['email' => $user->email, 'code' => $code])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Kode OTP tidak valid atau telah kedaluwarsa.');
    }

    public function test_verify_otp_lockout_after_5_attempts(): void
    {
        $user = User::factory()->create();
        $code = '123456';
        PasswordResetOtp::factory()->create([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
        ]);

        // 5 wrong attempts (6-digit to pass validation, wrong value)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/verify-otp', ['email' => $user->email, 'code' => '000000'])
                ->assertStatus(422);
        }

        // OTP invalidated — even the correct code now rejected
        $this->postJson('/api/auth/verify-otp', ['email' => $user->email, 'code' => $code])
            ->assertStatus(422);

        $otp = PasswordResetOtp::find($user->email);
        $this->assertNotNull($otp->used_at);
    }

    public function test_verify_otp_validates_code_format(): void
    {
        $this->postJson('/api/auth/verify-otp', ['email' => 'user@example.com', 'code' => '123'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    // ── reset-password ──

    public function test_reset_password_success(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        // Full flow: forgot → extract code → verify → reset
        $this->postJson('/api/auth/forgot-password', ['email' => $user->email]);
        $code = $this->extractOtpCode($user);

        $verifyResponse = $this->postJson('/api/auth/verify-otp', [
            'email' => $user->email,
            'code' => $code,
        ])->assertStatus(200);

        $resetToken = $verifyResponse->json('data.reset_token');

        $this->postJson('/api/auth/reset-password', [
            'reset_token' => $resetToken,
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Password berhasil diatur. Silakan login.');

        // Token consumed (one-time)
        $this->assertNull(Cache::get("pwreset:{$resetToken}"));

        // Password changed + must_change_password cleared
        $user->refresh();
        $this->assertTrue(Hash::check('new-password-123', $user->password));
        $this->assertFalse($user->must_change_password);

        // Login with new password succeeds
        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'new-password-123',
        ])->assertStatus(200);
    }

    public function test_reset_password_rejects_invalid_token(): void
    {
        $this->postJson('/api/auth/reset-password', [
            'reset_token' => 'invalid-token-string',
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Token reset tidak valid atau telah kedaluwarsa.');
    }

    public function test_reset_password_rejects_weak_password(): void
    {
        $user = User::factory()->create();
        $resetToken = $this->setupResetToken($user->email);

        $this->postJson('/api/auth/reset-password', [
            'reset_token' => $resetToken,
            'new_password' => 'short',
            'new_password_confirmation' => 'short',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_reset_password_rejects_unconfirmed_password(): void
    {
        $user = User::factory()->create();
        $resetToken = $this->setupResetToken($user->email);

        $this->postJson('/api/auth/reset-password', [
            'reset_token' => $resetToken,
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'different-value',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    // ── helpers ──

    private function setupResetToken(string $email): string
    {
        $code = '123456';
        PasswordResetOtp::factory()->create([
            'email' => $email,
            'code_hash' => Hash::make($code),
        ]);

        $response = $this->postJson('/api/auth/verify-otp', [
            'email' => $email,
            'code' => $code,
        ])->assertStatus(200);

        return $response->json('data.reset_token');
    }

    private function extractOtpCode(User $user): string
    {
        $notifications = Notification::sent($user, ResetPasswordOtpNotification::class);
        $notification = $notifications->first();

        $property = new ReflectionProperty(ResetPasswordOtpNotification::class, 'code');

        return $property->getValue($notification);
    }
}
