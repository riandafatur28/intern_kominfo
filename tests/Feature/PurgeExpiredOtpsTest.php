<?php

namespace Tests\Feature;

use App\Domains\Auth\Models\PasswordResetOtp;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurgeExpiredOtpsTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_purges_expired_and_used_records(): void
    {
        // Active — should survive
        PasswordResetOtp::create([
            'email' => 'active@test.com',
            'code_hash' => 'abc',
            'attempts' => 0,
            'expires_at' => Carbon::now()->addHours(1),
        ]);

        // Expired — should be purged
        PasswordResetOtp::create([
            'email' => 'expired@test.com',
            'code_hash' => 'abc',
            'attempts' => 0,
            'expires_at' => Carbon::now()->subHour(),
        ]);

        // Used — should be purged
        PasswordResetOtp::create([
            'email' => 'used@test.com',
            'code_hash' => 'abc',
            'attempts' => 0,
            'expires_at' => Carbon::now()->addHours(1),
            'used_at' => Carbon::now(),
        ]);

        $this->artisan('auth:purge-expired-otps')
            ->expectsOutputToContain('2')
            ->assertSuccessful();

        $this->assertDatabaseHas('password_reset_otps', ['email' => 'active@test.com']);
        $this->assertDatabaseMissing('password_reset_otps', ['email' => 'expired@test.com']);
        $this->assertDatabaseMissing('password_reset_otps', ['email' => 'used@test.com']);
    }
}
