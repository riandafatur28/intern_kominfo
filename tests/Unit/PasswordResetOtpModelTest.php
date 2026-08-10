<?php

namespace Tests\Unit;

use App\Domains\Auth\Models\PasswordResetOtp;
use Database\Factories\Domains\Auth\PasswordResetOtpFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PasswordResetOtpModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_uses_correct_table_name(): void
    {
        $otp = new PasswordResetOtp;

        $this->assertSame('password_reset_otps', $otp->getTable());
    }

    public function test_fillable_attributes(): void
    {
        $otp = new PasswordResetOtp;

        $this->assertSame(
            ['email', 'code_hash', 'expires_at', 'used_at', 'attempts', 'last_sent_at'],
            $otp->getFillable(),
        );
    }

    public function test_casts_datetime_and_integer_fields(): void
    {
        $otp = PasswordResetOtp::factory()->create([
            'expires_at' => '2026-08-07 12:00:00',
            'used_at' => '2026-08-07 12:05:00',
            'last_sent_at' => '2026-08-07 11:55:00',
            'attempts' => '3',
        ]);

        $this->assertInstanceOf(Carbon::class, $otp->expires_at);
        $this->assertInstanceOf(Carbon::class, $otp->used_at);
        $this->assertInstanceOf(Carbon::class, $otp->last_sent_at);
        $this->assertIsInt($otp->attempts);
        $this->assertSame(3, $otp->attempts);
    }

    public function test_factory_creates_persisted_row(): void
    {
        $otp = PasswordResetOtp::factory()->create();

        $this->assertDatabaseHas('password_reset_otps', ['email' => $otp->email]);
        $this->assertInstanceOf(PasswordResetOtpFactory::class, PasswordResetOtp::factory());
    }
}
