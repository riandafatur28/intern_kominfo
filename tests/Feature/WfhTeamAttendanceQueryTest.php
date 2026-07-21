<?php

namespace Tests\Feature;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Models\Team;
use App\Models\User;
use App\Support\Constants\WfhSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WfhTeamAttendanceQueryTest extends TestCase
{
    use RefreshDatabase;

    private WfhRepositoryInterface $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = $this->app->make(WfhRepositoryInterface::class);
    }

    public function test_returns_all_attendances_for_team_on_date(): void
    {
        $team = Team::factory()->create();
        $userA = User::factory()->create(['team_id' => $team->id]);
        $userB = User::factory()->create(['team_id' => $team->id]);

        // userA: pagi + siang
        WfhAttendance::create([
            'user_id' => $userA->id, 'date' => '2026-07-17',
            'session' => WfhSession::PAGI, 'photo_path' => 'a/pagi.webp', 'check_in_at' => now(),
        ]);
        WfhAttendance::create([
            'user_id' => $userA->id, 'date' => '2026-07-17',
            'session' => WfhSession::SIANG, 'photo_path' => 'a/siang.webp', 'check_in_at' => now(),
        ]);
        // userB: only sore
        WfhAttendance::create([
            'user_id' => $userB->id, 'date' => '2026-07-17',
            'session' => WfhSession::SORE, 'photo_path' => 'b/sore.webp', 'check_in_at' => now(),
        ]);

        $records = $this->repo->getTeamAttendancesForDate($team->id, '2026-07-17');

        $this->assertCount(3, $records);
        $this->assertTrue($records->every(fn ($r) => $r->relationLoaded('user')));
    }

    public function test_excludes_other_teams_attendance(): void
    {
        $teamA = Team::factory()->create();
        $teamB = Team::factory()->create();

        $userA = User::factory()->create(['team_id' => $teamA->id]);
        $userB = User::factory()->create(['team_id' => $teamB->id]);

        WfhAttendance::create([
            'user_id' => $userA->id, 'date' => '2026-07-17',
            'session' => WfhSession::PAGI, 'photo_path' => 'a/pagi.webp', 'check_in_at' => now(),
        ]);
        WfhAttendance::create([
            'user_id' => $userB->id, 'date' => '2026-07-17',
            'session' => WfhSession::PAGI, 'photo_path' => 'b/pagi.webp', 'check_in_at' => now(),
        ]);

        $recordsA = $this->repo->getTeamAttendancesForDate($teamA->id, '2026-07-17');
        $this->assertCount(1, $recordsA);
        $this->assertEquals($userA->id, $recordsA->first()->user_id);
    }

    public function test_returns_empty_when_no_attendance(): void
    {
        $team = Team::factory()->create();
        $records = $this->repo->getTeamAttendancesForDate($team->id, '2026-07-17');
        $this->assertCount(0, $records);
    }

    public function test_returns_only_for_given_date(): void
    {
        $team = Team::factory()->create();
        $user = User::factory()->create(['team_id' => $team->id]);

        WfhAttendance::create([
            'user_id' => $user->id, 'date' => '2026-07-17',
            'session' => WfhSession::PAGI, 'photo_path' => 'a.webp', 'check_in_at' => now(),
        ]);
        WfhAttendance::create([
            'user_id' => $user->id, 'date' => '2026-07-24',
            'session' => WfhSession::PAGI, 'photo_path' => 'b.webp', 'check_in_at' => now(),
        ]);

        $records = $this->repo->getTeamAttendancesForDate($team->id, '2026-07-17');
        $this->assertCount(1, $records);
    }
}
