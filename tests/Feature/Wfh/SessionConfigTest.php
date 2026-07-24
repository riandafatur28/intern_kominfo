<?php

namespace Tests\Feature\Wfh;

use App\Domains\Wfh\Models\WfhReport;
use App\Domains\Wfh\Models\WfhReportActivity;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SessionConfigTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);

        // Freeze to a weekday (Monday) so day-of-week restrictions
        // don't flake based on when the test is run.
        Carbon::setTestNow(Carbon::parse('2026-07-20 10:00:00', 'Asia/Jakarta'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_checkin_accepts_default_sessions_from_setting(): void
    {
        $user = User::factory()->create();
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        // Default: pagi, siang, sore — all should be accepted
        foreach (['pagi', 'siang', 'sore'] as $session) {
            $this->postJson('/api/wfh/attendance', [
                'session' => $session,
                'date' => now()->toDateString(),
                'photo' => UploadedFile::fake()->image("{$session}.jpg"),
            ])->assertStatus(201);
        }
    }

    public function test_checkin_rejects_sessions_not_in_setting(): void
    {
        Setting::set('wfh_sessions', ['pagi', 'sore']);

        $user = User::factory()->create();
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->postJson('/api/wfh/attendance', [
            'session' => 'siang',
            'date' => now()->toDateString(),
            'photo' => UploadedFile::fake()->image('siang.jpg'),
        ])->assertStatus(422);
    }

    public function test_activity_can_be_created_without_start_end_time(): void
    {
        $report = WfhReport::factory()->create();

        $activity = WfhReportActivity::create([
            'wfh_report_id' => $report->id,
            'activity' => 'Test without time',
            'sort_order' => 0,
        ]);

        $this->assertNotNull($activity);
        $this->assertNull($activity->start_time);
        $this->assertNull($activity->end_time);
        $this->assertEquals('Test without time', $activity->activity);
    }
}
