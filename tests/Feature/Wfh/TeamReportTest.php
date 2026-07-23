<?php

namespace Tests\Feature\Wfh;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeamReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);
    }

    // === CRUD ===

    public function test_admin_can_create_team_report(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/wfh/team-reports', [
            'team_id' => $team->id,
            'report_date' => now()->toDateString(),
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_non_admin_cannot_create_team_report(): void
    {
        $team = Team::factory()->create();
        $staf = User::factory()->create();
        $staf->assignRole('staf');
        Sanctum::actingAs($staf);

        $this->postJson('/api/admin/wfh/team-reports', [
            'team_id' => $team->id,
            'report_date' => now()->toDateString(),
        ])->assertStatus(403);
    }

    public function test_admin_cannot_create_team_report_for_other_field(): void
    {
        $fieldA = Field::create(['name' => 'Bidang A']);
        $teamB = Team::create(['field_id' => Field::create(['name' => 'Bidang B'])->id, 'name' => 'Tim B']);

        $admin = User::factory()->create(['team_id' => Team::create(['field_id' => $fieldA->id, 'name' => 'Tim A'])->id]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/wfh/team-reports', [
            'team_id' => $teamB->id,
            'report_date' => now()->toDateString(),
        ])->assertStatus(403);
    }

    // === Approval ===

    public function test_kb_can_approve_team_report(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $kb = User::factory()->create(['team_id' => $team->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);

        $report = $this->createTeamReport($team);
        Sanctum::actingAs($kb);

        $this->postJson("/api/admin/wfh/team-reports/{$report->id}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_admin_can_approve_team_report_as_admin_has_all_permissions(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);
        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');

        $report = $this->createTeamReport($team);
        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/wfh/team-reports/{$report->id}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_kb_can_reject_team_report(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $kb = User::factory()->create(['team_id' => $team->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);

        $report = $this->createTeamReport($team);
        Sanctum::actingAs($kb);

        $this->postJson("/api/admin/wfh/team-reports/{$report->id}/reject", [
            'reason' => 'Data tidak lengkap',
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected');
    }

    // === Data compilation ===

    public function test_get_team_report_data_includes_all_members(): void
    {
        $team = Team::factory()->create();
        $member1 = User::factory()->create(['team_id' => $team->id]);
        $member2 = User::factory()->create(['team_id' => $team->id]);
        $member3 = User::factory()->create(['team_id' => $team->id]);

        WfhReport::factory()->create([
            'user_id' => $member1->id,
            'report_date' => now()->toDateString(),
            'status' => 'pending',
        ]);
        WfhAttendance::create([
            'user_id' => $member2->id,
            'date' => now()->toDateString(),
            'session' => 'pagi',
            'photo_path' => 'photo.jpg',
            'check_in_at' => now(),
        ]);

        $data = app(\App\Domains\Wfh\Repositories\WfhRepositoryInterface::class)
            ->getTeamReportData($team->id, now()->toDateString());

        $this->assertCount(3, $data);
        $names = collect($data)->pluck('name')->toArray();
        $this->assertContains(strtoupper($member1->name), $names);
        $this->assertContains(strtoupper($member2->name), $names);
        $this->assertContains(strtoupper($member3->name), $names);
    }

    public function test_member_without_report_has_no_links_and_no_photos(): void
    {
        $team = Team::factory()->create();
        $member = User::factory()->create(['team_id' => $team->id]);

        $data = app(\App\Domains\Wfh\Repositories\WfhRepositoryInterface::class)
            ->getTeamReportData($team->id, now()->toDateString());

        $this->assertCount(1, $data);
        $this->assertEmpty($data[0]['links']);
        $this->assertEmpty($data[0]['photos']);
    }

    public function test_duplicate_team_report_for_same_date_returns_error(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/wfh/team-reports', [
            'team_id' => $team->id,
            'report_date' => now()->toDateString(),
        ])->assertStatus(201);

        // Second create for same team+date
        $this->postJson('/api/admin/wfh/team-reports', [
            'team_id' => $team->id,
            'report_date' => now()->toDateString(),
        ])->assertStatus(422);
    }

    public function test_approve_non_pending_team_report_returns_422(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $kb = User::factory()->create(['team_id' => $team->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);
        Sanctum::actingAs($kb);

        $report = $this->createTeamReport($team);
        $report->update(['status' => 'approved']);

        $this->postJson("/api/admin/wfh/team-reports/{$report->id}/approve")
            ->assertStatus(422);
    }

    public function test_reject_non_pending_team_report_returns_422(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $kb = User::factory()->create(['team_id' => $team->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);
        Sanctum::actingAs($kb);

        $report = $this->createTeamReport($team);
        $report->update(['status' => 'rejected']);

        $this->postJson("/api/admin/wfh/team-reports/{$report->id}/reject", [
            'reason' => 'Already rejected',
        ])->assertStatus(422);
    }

    // === Helpers ===

    private function createTeamReport(Team $team): mixed
    {
        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');

        return \App\Domains\Wfh\Models\WfhTeamReport::create([
            'team_id' => $team->id,
            'report_date' => now()->toDateString(),
            'status' => 'pending',
            'created_by' => $admin->id,
        ]);
    }
}
