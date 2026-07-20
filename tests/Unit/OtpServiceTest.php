<?php

namespace Tests\Unit;

use App\Domains\Auth\Models\PasswordResetOtp;
use App\Domains\Auth\Services\OtpService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OtpServiceTest extends TestCase
{
    use RefreshDatabase;

    private OtpService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = $this->app->make(OtpService::class);
    }

    public function test_issue_creates_otp_and_returns_code(): void
    {
        $result = $this->service->issue('user@test.com');

        $this->assertArrayHasKey('code', $result);
        $this->assertArrayHasKey('expires_at', $result);
        $this->assertArrayHasKey('cooldown_remaining', $result);
        $this->assertNull($result['cooldown_remaining']);
        $this->assertSame(config('otp.length'), strlen((string) $result['code']));

        $otp = PasswordResetOtp::where('email', 'user@test.com')->first();
        $this->assertNotNull($otp);
        $this->assertNotEquals($result['code'], $otp->code_hash);
        $this->assertNull($otp->used_at);
        $this->assertSame(0, $otp->attempts);
    }

    public function test_issue_respects_cooldown(): void
    {
        $this->service->issue('user@test.com');

        $result = $this->service->issue('user@test.com');

        $this->assertNotNull($result['cooldown_remaining']);
        $this->assertGreaterThan(0, $result['cooldown_remaining']);
    }

    public function test_verify_with_correct_code_returns_true(): void
    {
        $issued = $this->service->issue('user@test.com');

        $verified = $this->service->verify('user@test.com', $issued['code']);

        $this->assertTrue($verified);

        $otp = PasswordResetOtp::where('email', 'user@test.com')->first();
        $this->assertNotNull($otp->used_at);
    }

    public function test_verify_with_wrong_code_returns_false(): void
    {
        $this->service->issue('user@test.com');

        $verified = $this->service->verify('user@test.com', '000000');

        $this->assertFalse($verified);

        $otp = PasswordResetOtp::where('email', 'user@test.com')->first();
        $this->assertSame(1, $otp->attempts);
    }

    public function test_verify_with_exhausted_attempts_invalidates(): void
    {
        $issued = $this->service->issue('user@test.com');

        for ($i = 0; $i < config('otp.max_attempts'); $i++) {
            $this->service->verify('user@test.com', '000000');
        }

        $verified = $this->service->verify('user@test.com', $issued['code']);
        $this->assertFalse($verified);

        $otp = PasswordResetOtp::where('email', 'user@test.com')->first();
        $this->assertNotNull($otp->used_at);
    }

    public function test_verify_with_expired_code_returns_false(): void
    {
        $issued = $this->service->issue('user@test.com');

        PasswordResetOtp::where('email', 'user@test.com')
            ->update(['expires_at' => Carbon::now()->subMinute()]);

        $verified = $this->service->verify('user@test.com', $issued['code']);
        $this->assertFalse($verified);
    }

    public function test_purge_expired_removes_expired_and_used(): void
    {
        $this->service->issue('alive@test.com');
        $this->service->issue('expired@test.com');
        PasswordResetOtp::where('email', 'expired@test.com')
            ->update(['expires_at' => Carbon::now()->subMinute()]);

        $this->service->issue('used@test.com');
        $issued = $this->service->issue('used2@test.com');
        $this->service->verify('used2@test.com', $issued['code']);

        $purged = $this->service->purgeExpired();

        $this->assertSame(2, $purged);
        $this->assertDatabaseHas('password_reset_otps', ['email' => 'alive@test.com']);
        $this->assertDatabaseMissing('password_reset_otps', ['email' => 'expired@test.com']);
        $this->assertDatabaseMissing('password_reset_otps', ['email' => 'used2@test.com']);
    }

    public function test_reissue_after_expiry_does_not_throw(): void
    {
        $this->service->issue('expire-then-reissue@test.com');
        PasswordResetOtp::where('email', 'expire-then-reissue@test.com')
            ->update(['expires_at' => Carbon::now()->subMinute()]);

        // Before the fix this hit unique(email) violation.
        $result = $this->service->issue('expire-then-reissue@test.com');

        $this->assertNull($result['cooldown_remaining']);
        $this->assertSame(config('otp.length'), strlen($result['code']));
        $this->assertSame(1, PasswordResetOtp::where('email', 'expire-then-reissue@test.com')->count());
    }

    public function test_reissue_after_use_does_not_throw(): void
    {
        $issued = $this->service->issue('use-then-reissue@test.com');
        $this->service->verify('use-then-reissue@test.com', $issued['code']);

        $result = $this->service->issue('use-then-reissue@test.com');

        $this->assertNull($result['cooldown_remaining']);
        $this->assertSame(config('otp.length'), strlen($result['code']));
        $this->assertSame(1, PasswordResetOtp::where('email', 'use-then-reissue@test.com')->count());
    }
}
