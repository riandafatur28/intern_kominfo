<?php

namespace Tests\Unit;

use App\Domains\Auth\Models\PasswordResetOtp;
use App\Domains\Auth\Services\PasswordResetService;
use App\Models\User;
use App\Notifications\ResetPasswordOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetServiceTest extends TestCase
{
    use RefreshDatabase;

    private PasswordResetService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->service = app(PasswordResetService::class);
        Notification::fake();
    }

    // ── sendOtp ──

    public function test_send_otp_creates_row_and_dispatches_notification(): void
    {
        $user = User::factory()->create();

        $this->service->sendOtp($user->email);

        $this->assertDatabaseHas('password_reset_otps', ['email' => $user->email]);
        $this->assertNotNull(PasswordResetOtp::find($user->email)->expires_at);
        Notification::assertSentTo($user, ResetPasswordOtpNotification::class);
    }

    public function test_send_otp_silent_noop_for_unregistered_email(): void
    {
        $this->service->sendOtp('unregistered@example.com');

        $this->assertDatabaseCount('password_reset_otps', 0);
        Notification::assertNothingSent();
    }

    public function test_send_otp_silent_noop_for_inactive_user(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $this->service->sendOtp($user->email);

        $this->assertDatabaseCount('password_reset_otps', 0);
        Notification::assertNothingSent();
    }

    public function test_send_otp_enforces_cooldown_60_seconds(): void
    {
        $user = User::factory()->create();
        $this->service->sendOtp($user->email);

        // Save last_sent_at
        $otp = PasswordResetOtp::find($user->email);
        $lastSent = $otp->last_sent_at;

        // Kirim lagi segera
        $this->service->sendOtp($user->email);

        $otp->refresh();
        $this->assertEquals($lastSent->timestamp, $otp->last_sent_at->timestamp);
        Notification::assertSentToTimes($user, ResetPasswordOtpNotification::class, 1);
    }

    public function test_send_otp_resets_attempts_on_new_otp(): void
    {
        $user = User::factory()->create();
        PasswordResetOtp::factory()->create([
            'email' => $user->email,
            'attempts' => 3,
        ]);

        $this->service->sendOtp($user->email);

        $otp = PasswordResetOtp::find($user->email);
        $this->assertSame(0, $otp->attempts);
        $this->assertNull($otp->used_at);
    }

    // ── verifyOtp ──

    public function test_verify_otp_returns_reset_token(): void
    {
        $user = User::factory()->create();
        $code = '123456';
        PasswordResetOtp::factory()->create([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
        ]);

        $result = $this->service->verifyOtp($user->email, $code);

        $this->assertIsString($result);
        $this->assertNotEmpty($result);
        // Verify token stored in cache
        $cached = Cache::get("pwreset:$result");
        $this->assertSame($user->email, $cached['email'] ?? null);
        // OTP marked as used
        $otp = PasswordResetOtp::find($user->email);
        $this->assertNotNull($otp->used_at);
    }

    public function test_verify_otp_returns_false_for_no_row(): void
    {
        $this->assertFalse($this->service->verifyOtp('nonexistent@example.com', '123456'));
    }

    public function test_verify_otp_returns_false_for_expired_otp(): void
    {
        $user = User::factory()->create();
        PasswordResetOtp::factory()->expired()->create([
            'email' => $user->email,
            'code_hash' => Hash::make('123456'),
        ]);

        $this->assertFalse($this->service->verifyOtp($user->email, '123456'));
    }

    public function test_verify_otp_returns_false_for_used_otp(): void
    {
        $user = User::factory()->create();
        PasswordResetOtp::factory()->used()->create([
            'email' => $user->email,
            'code_hash' => Hash::make('123456'),
        ]);

        $this->assertFalse($this->service->verifyOtp($user->email, '123456'));
    }

    public function test_verify_otp_lockout_after_5_attempts(): void
    {
        $user = User::factory()->create();
        $code = '123456';
        PasswordResetOtp::factory()->create([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
        ]);

        // 5 percobaan gagal
        for ($i = 0; $i < 5; $i++) {
            $this->assertFalse($this->service->verifyOtp($user->email, 'wrong'));
        }

        // OTP harus invalidated (used_at set)
        $otp = PasswordResetOtp::find($user->email);
        $this->assertNotNull($otp->used_at);

        // Attempt ke-6 juga false, tidak crash
        $this->assertFalse($this->service->verifyOtp($user->email, $code));
    }

    public function test_verify_otp_increments_attempts_on_wrong_code(): void
    {
        $user = User::factory()->create();
        PasswordResetOtp::factory()->create([
            'email' => $user->email,
            'code_hash' => Hash::make('correct'),
        ]);

        $this->assertFalse($this->service->verifyOtp($user->email, 'wrong'));

        $otp = PasswordResetOtp::find($user->email);
        $this->assertSame(1, $otp->attempts);
    }

    // ── resetPassword ──

    public function test_reset_password_updates_password(): void
    {
        $user = User::factory()->create();
        $token = $this->setupValidResetToken($user->email);

        $result = $this->service->resetPassword($token, 'new-password-123');

        $this->assertTrue($result);

        $user->refresh();
        $this->assertTrue(Hash::check('new-password-123', $user->password));
        $this->assertFalse($user->must_change_password);
    }

    public function test_reset_password_returns_false_for_invalid_token(): void
    {
        $this->assertFalse($this->service->resetPassword('invalid-token', 'new-password-123'));
    }

    public function test_reset_password_is_one_time(): void
    {
        $user = User::factory()->create();
        $token = $this->setupValidResetToken($user->email);

        $this->assertTrue($this->service->resetPassword($token, 'new-password-123'));
        // Token sudah di-forget, pakai lagi gagal
        $this->assertFalse($this->service->resetPassword($token, 'another-password'));
    }

    public function test_reset_password_silent_noop_for_inactive_user(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $token = $this->setupValidResetToken($user->email);

        $this->assertFalse($this->service->resetPassword($token, 'new-password-123'));
    }

    public function test_reset_password_returns_false_for_deleted_user(): void
    {
        // Use direct DB insert to avoid observer interference with soft deletes
        $user = User::factory()->create();
        $email = $user->email;
        $token = $this->setupValidResetToken($email);

        $user->delete();
        $user->refresh();

        $this->assertFalse($this->service->resetPassword($token, 'new-password-123'));
    }

    private function setupValidResetToken(string $email): string
    {
        $code = '123456';
        PasswordResetOtp::factory()->create([
            'email' => $email,
            'code_hash' => Hash::make($code),
        ]);

        $token = $this->service->verifyOtp($email, $code);
        $this->assertIsString($token);

        return $token;
    }
}
