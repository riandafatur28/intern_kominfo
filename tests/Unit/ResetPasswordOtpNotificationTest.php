<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\ResetPasswordOtpNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\View;
use Tests\TestCase;

class ResetPasswordOtpNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_notification_implements_should_queue(): void
    {
        $notification = new ResetPasswordOtpNotification('123456', 'Test User');

        $this->assertInstanceOf(ShouldQueue::class, $notification);
    }

    public function test_notification_uses_queueable_trait(): void
    {
        $notification = new ResetPasswordOtpNotification('123456', 'Test User');

        $this->assertContains('mail', $notification->via(new User));
    }

    public function test_to_mail_returns_mail_message_with_view(): void
    {
        Notification::fake();

        $user = User::factory()->create(['name' => 'Test User']);
        $code = '123456';

        $notification = new ResetPasswordOtpNotification($code, $user->name);
        $notification->toMail($user);

        $this->assertTrue(View::exists('emails.reset-password-otp'));
    }

    public function test_view_renders_without_error(): void
    {
        $html = View::make('emails.reset-password-otp', [
            'code' => '123456',
            'name' => 'Test User',
        ])->render();

        $this->assertStringContainsString('123456', $html);
        $this->assertStringContainsString('Test User', $html);
        $this->assertStringContainsString('15 menit', $html);
    }
}
