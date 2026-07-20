<?php

namespace Tests\Feature;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use App\Notifications\WfhIncompleteAttendanceNotification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotifyIncompleteAttendanceTest extends TestCase
{
    use RefreshDatabase;

    private User $completeUser;

    private User $partialUser;

    private User $noAttendanceUser;

    private string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $field = Field::create(['name' => 'Bidang Test']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim Test']);
        $this->date = Carbon::today()->toDateString();

        $this->completeUser = User::factory()->create([
            'name' => 'Complete',
            'team_id' => $team->id,
            'is_active' => true,
        ]);
        foreach (['pagi', 'siang', 'sore'] as $session) {
            WfhAttendance::create([
                'user_id' => $this->completeUser->id,
                'date' => $this->date,
                'session' => $session,
                'photo_path' => 'test.jpg',
            ]);
        }

        $this->partialUser = User::factory()->create([
            'name' => 'Partial',
            'team_id' => $team->id,
            'is_active' => true,
        ]);
        WfhAttendance::create([
            'user_id' => $this->partialUser->id,
            'date' => $this->date,
            'session' => 'pagi',
            'photo_path' => 'test.jpg',
        ]);

        $this->noAttendanceUser = User::factory()->create([
            'name' => 'NoAttendance',
            'team_id' => $team->id,
            'is_active' => true,
        ]);
    }

    public function test_command_notifies_incomplete_users(): void
    {
        Notification::fake();

        $this->artisan('wfh:notify-incomplete-attendance', ['--date' => $this->date])
            ->expectsOutputToContain('2')
            ->assertSuccessful();

        Notification::assertSentToTimes(
            $this->partialUser,
            WfhIncompleteAttendanceNotification::class,
            1
        );
        Notification::assertSentToTimes(
            $this->noAttendanceUser,
            WfhIncompleteAttendanceNotification::class,
            1
        );
        Notification::assertNotSentTo(
            $this->completeUser,
            WfhIncompleteAttendanceNotification::class,
        );
    }

    public function test_command_skips_already_notified_users(): void
    {
        Notification::fake();

        $this->artisan('wfh:notify-incomplete-attendance', ['--date' => $this->date]);

        Notification::fake();
        $this->artisan('wfh:notify-incomplete-attendance', ['--date' => $this->date])
            ->expectsOutputToContain('0')
            ->assertSuccessful();
    }

    public function test_command_does_not_send_to_inactive_users(): void
    {
        Notification::fake();

        $inactive = User::factory()->create([
            'is_active' => false,
        ]);

        $this->artisan('wfh:notify-incomplete-attendance', [
            '--date' => Carbon::today()->toDateString(),
        ])->assertSuccessful();

        // active users (partial, noAttendance) should get notified; inactive should not
        Notification::assertSentToTimes($this->partialUser, WfhIncompleteAttendanceNotification::class, 1);
        Notification::assertNotSentTo($inactive, WfhIncompleteAttendanceNotification::class);
    }
}
