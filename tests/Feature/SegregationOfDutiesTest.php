<?php

namespace Tests\Feature;

use App\Domains\ChangeManagement\Models\ChangeImplementation;
use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Domains\Wfh\Models\WfhReport;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SegregationOfDutiesTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithRole(string $role, ?Team $team = null): User
    {
        $team ??= Team::factory()->create();

        $user = User::factory()->create([
            'team_id' => $team->id,
        ]);
        $user->assignRole($role);

        return $user;
    }

    /**
     * Build a package in pending state directly (bypassing the API) for authz tests.
     */
    private function createPendingPackage(User $initiator): ChangeInitiation
    {
        $initiation = ChangeInitiation::factory()->create(['initiator_id' => $initiator->id]);
        ChangeImplementation::create([
            'change_initiation_id' => $initiation->id,
            'status' => 'draft',
            'priority' => 'normal',
            'impact' => 'Minor',
        ]);
        $initiation->update(['status' => 'pending']);

        return $initiation->fresh();
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    /**
     * WFH: report maker can approve own report (self-approve guard removed per Issue F).
     */
    public function test_wfh_maker_can_approve_own_report(): void
    {
        $team = Team::factory()->create();
        $maker = $this->createUserWithRole('kepala_bidang', $team);

        $report = WfhReport::factory()->create([
            'user_id' => $maker->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($maker);

        $this->postJson("/api/wfh/reports/{$report->id}/approve")
            ->assertStatus(200);
    }

    /**
     * WFH: report maker can reject own report (self-approve guard removed per Issue F).
     */
    public function test_wfh_maker_can_reject_own_report(): void
    {
        $team = Team::factory()->create();
        $maker = $this->createUserWithRole('kepala_bidang', $team);

        $report = WfhReport::factory()->create([
            'user_id' => $maker->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($maker);

        $this->postJson("/api/wfh/reports/{$report->id}/reject", [
            'reason' => 'Not good enough',
        ])
            ->assertStatus(200);
    }

    /**
     * WFH: different supervisor CAN approve a report.
     */
    public function test_wfh_supervisor_can_approve_others_report(): void
    {
        $field = Field::factory()->create();
        $team = Team::factory()->create(['field_id' => $field->id]);
        $maker = $this->createUserWithRole('staf', $team);
        $supervisor = $this->createUserWithRole('kepala_bidang', $team);
        $field->update(['head_id' => $supervisor->id]);

        $report = WfhReport::factory()->create([
            'user_id' => $maker->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($supervisor);

        $this->postJson("/api/wfh/reports/{$report->id}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');
    }

    // === WFH cross-field guard (Phase 2) ===

    public function test_cross_field_approve_individual_report_returns_403(): void
    {
        $fieldA = Field::factory()->create();
        $teamA = Team::factory()->create(['field_id' => $fieldA->id]);
        $fieldB = Field::factory()->create(['name' => 'Bidang B']);
        $teamB = Team::factory()->create(['field_id' => $fieldB->id]);

        $kb = User::factory()->create(['team_id' => $teamA->id]);
        $kb->assignRole('kepala_bidang');
        $fieldA->update(['head_id' => $kb->id]);

        $staf = User::factory()->create(['team_id' => $teamB->id]);
        $report = WfhReport::factory()->create([
            'user_id' => $staf->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($kb);

        $this->postJson("/api/wfh/reports/{$report->id}/approve")
            ->assertStatus(403);
    }

    public function test_cross_field_reject_individual_report_returns_403(): void
    {
        $fieldA = Field::factory()->create();
        $teamA = Team::factory()->create(['field_id' => $fieldA->id]);
        $fieldB = Field::factory()->create(['name' => 'Bidang B']);
        $teamB = Team::factory()->create(['field_id' => $fieldB->id]);

        $kb = User::factory()->create(['team_id' => $teamA->id]);
        $kb->assignRole('kepala_bidang');
        $fieldA->update(['head_id' => $kb->id]);

        $staf = User::factory()->create(['team_id' => $teamB->id]);
        $report = WfhReport::factory()->create([
            'user_id' => $staf->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($kb);

        $this->postJson("/api/wfh/reports/{$report->id}/reject", [
            'reason' => 'Alasan',
        ])
            ->assertStatus(403);
    }

    // === Admin cross-field guard (no break-glass) ===

    public function test_admin_cross_field_approve_individual_report_returns_403(): void
    {
        $fieldA = Field::factory()->create();
        $teamA = Team::factory()->create(['field_id' => $fieldA->id]);
        $fieldB = Field::factory()->create(['name' => 'Bidang B']);
        $teamB = Team::factory()->create(['field_id' => $fieldB->id]);

        $admin = User::factory()->create(['team_id' => $teamA->id]);
        $admin->assignRole('admin');
        $stafB = User::factory()->create(['team_id' => $teamB->id]);
        $report = WfhReport::factory()->create([
            'user_id' => $stafB->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/wfh/reports/{$report->id}/approve")
            ->assertStatus(403);
    }

    public function test_admin_cross_field_reject_individual_report_returns_403(): void
    {
        $fieldA = Field::factory()->create();
        $teamA = Team::factory()->create(['field_id' => $fieldA->id]);
        $fieldB = Field::factory()->create(['name' => 'Bidang B']);
        $teamB = Team::factory()->create(['field_id' => $fieldB->id]);

        $admin = User::factory()->create(['team_id' => $teamA->id]);
        $admin->assignRole('admin');

        $stafB = User::factory()->create(['team_id' => $teamB->id]);
        $report = WfhReport::factory()->create([
            'user_id' => $stafB->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/wfh/reports/{$report->id}/reject", [
            'reason' => 'Bukan bidang saya',
        ])
            ->assertStatus(403);
    }

    public function test_admin_without_team_cannot_approve_individual_report(): void
    {
        $admin = User::factory()->create(['team_id' => null]);
        $admin->assignRole('admin');

        $report = WfhReport::factory()->create(['status' => 'pending']);

        Sanctum::actingAs($admin);

        $this->postJson("/api/wfh/reports/{$report->id}/approve")
            ->assertStatus(403);
    }

    /**
     * Change: initiation initiator cannot approve their own initiation.
     */
    public function test_initiator_cannot_approve_own_initiation(): void
    {
        $initiator = $this->createUserWithRole('kepala_tim');
        $initiation = $this->createPendingPackage($initiator);

        Sanctum::actingAs($initiator);

        $this->postJson("/api/changes/{$initiation->id}/approve")
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /**
     * Change: initiation initiator cannot reject their own initiation.
     */
    public function test_initiator_cannot_reject_own_initiation(): void
    {
        $initiator = $this->createUserWithRole('kepala_tim');
        $initiation = $this->createPendingPackage($initiator);

        Sanctum::actingAs($initiator);

        $this->postJson("/api/changes/{$initiation->id}/reject", [
            'reason' => 'Not feasible',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /**
     * Change: different reviewer CAN approve an initiation.
     */
    public function test_reviewer_can_approve_others_initiation(): void
    {
        $team = Team::factory()->create();
        $initiator = $this->createUserWithRole('staf', $team);
        $reviewer = $this->createUserWithRole('kepala_tim', $team);
        $initiation = $this->createPendingPackage($initiator);

        Sanctum::actingAs($reviewer);

        $this->postJson("/api/changes/{$initiation->id}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.initiation.status', 'approved');
    }
}
