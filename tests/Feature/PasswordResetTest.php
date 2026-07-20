<?php

namespace Tests\Feature;

use App\Domains\Auth\Mail\ResetPasswordOtpMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->seed('RolePermissionSeeder');
        $this->user = User::factory()->create([
            'email' => 'user@test.com',
            'is_active' => true,
        ]);
    }

    public function test_forgot_returns_same_response_for_any_email(): void
    {
        $registered = $this->postJson('/api/password/forgot', [
            'email' => 'user@test.com',
        ]);
        $unregistered = $this->postJson('/api/password/forgot', [
            'email' => 'nonexistent@test.com',
        ]);

        $this->assertSame(
            $registered->json('success'),
            $unregistered->json('success'),
        );
        $this->assertSame(200, $registered->status());
        $this->assertSame(200, $unregistered->status());
    }

    public function test_forgot_sends_email_only_to_registered_user(): void
    {
        $this->postJson('/api/password/forgot', ['email' => 'user@test.com']);
        $this->postJson('/api/password/forgot', ['email' => 'ghost@test.com']);

        Mail::assertSent(ResetPasswordOtpMail::class, function ($mail) {
            return $mail->hasTo('user@test.com');
        });
        Mail::assertNotSent(ResetPasswordOtpMail::class, function ($mail) {
            return $mail->hasTo('ghost@test.com');
        });
    }

    public function test_full_reset_flow(): void
    {
        $this->postJson('/api/password/forgot', ['email' => 'user@test.com']);

        $otpCode = $this->getOtpFromMail('user@test.com');
        $this->assertNotNull($otpCode);

        $newPassword = 'NewPassw0rd!';
        $response = $this->postJson('/api/password/reset', [
            'email' => 'user@test.com',
            'code' => $otpCode,
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertFalse(Hash::check('password', $this->user->fresh()->password));
        $this->assertTrue(Hash::check($newPassword, $this->user->fresh()->password));
    }

    public function test_reset_with_wrong_otp_fails(): void
    {
        $this->postJson('/api/password/forgot', ['email' => 'user@test.com']);

        $response = $this->postJson('/api/password/reset', [
            'email' => 'user@test.com',
            'code' => '000000',
            'password' => 'NewPassw0rd!',
            'password_confirmation' => 'NewPassw0rd!',
        ]);

        $response->assertStatus(422);
    }

    public function test_reset_with_exhausted_otp_locks_out(): void
    {
        config(['otp.max_attempts' => 2]);

        $this->postJson('/api/password/forgot', ['email' => 'user@test.com']);
        $otpCode = $this->getOtpFromMail('user@test.com');

        for ($i = 0; $i < config('otp.max_attempts'); $i++) {
            $this->postJson('/api/password/reset', [
                'email' => 'user@test.com',
                'code' => '000000',
                'password' => 'NewPassw0rd!',
                'password_confirmation' => 'NewPassw0rd!',
            ]);
        }

        $response = $this->postJson('/api/password/reset', [
            'email' => 'user@test.com',
            'code' => $otpCode,
            'password' => 'NewPassw0rd!',
            'password_confirmation' => 'NewPassw0rd!',
        ]);
        $response->assertStatus(422);
    }

    public function test_resend_respects_cooldown(): void
    {
        $this->postJson('/api/password/forgot', ['email' => 'user@test.com']);

        Mail::fake();

        $response = $this->postJson('/api/password/resend', ['email' => 'user@test.com']);
        $response->assertStatus(429);
    }

    public function test_resend_after_cooldown_sends_new_otp(): void
    {
        config(['otp.cooldown_seconds' => 1]);

        $this->postJson('/api/password/forgot', ['email' => 'user@test.com']);

        Mail::fake();
        Carbon::setTestNow(Carbon::now()->addSeconds(2));

        $response = $this->postJson('/api/password/resend', ['email' => 'user@test.com']);
        $response->assertStatus(200);

        Mail::assertSent(ResetPasswordOtpMail::class, function ($mail) {
            return $mail->hasTo('user@test.com');
        });
    }

    private function getOtpFromMail(string $email): ?string
    {
        $mailables = Mail::sent(ResetPasswordOtpMail::class, function ($mail) use ($email) {
            return $mail->hasTo($email);
        });

        return $mailables[0]->code ?? null;
    }
}
