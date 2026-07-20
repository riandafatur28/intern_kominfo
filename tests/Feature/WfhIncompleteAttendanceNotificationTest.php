<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class WfhIncompleteAttendanceNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_contains_missing_sessions(): void
    {
        Notification::fake();

        $user = User::factory()->create(['is_active' => true]);
        $date = Carbon::today();

        $user->notify(new \App\Notifications\WfhIncompleteAttendanceNotification($date, ['siang', 'sore']));

        Notification::assertSentTo(
            $user,
            \App\Notifications\WfhIncompleteAttendanceNotification::class,
            function ($notification, $channels) use ($date) {
                return $notification->date->format('Y-m-d') === $date->format('Y-m-d')
                    && $notification->missingSessions === ['siang', 'sore'];
            }
        );
    }

    public function test_notification_mailable_builds_correctly(): void
    {
        $user = User::factory()->create(['name' => 'Test User', 'is_active' => true]);
        $notification = new \App\Notifications\WfhIncompleteAttendanceNotification(
            Carbon::parse('2026-07-20'),
            ['pagi']
        );

        $mail = $notification->toMail($user);

        $this->assertStringContainsString('Pengingat Absensi WFH', $mail->subject);
    }
}
