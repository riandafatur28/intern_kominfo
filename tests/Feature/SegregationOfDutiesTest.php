<?php

namespace Tests\Feature;

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

    /**
     * Change: initiation initiator cannot approve their own initiation.
     */
    public function test_initiator_cannot_approve_own_initiation(): void
    {
        $field = Field::factory()->create();
        $initiator = $this->createUserWithRole('kepala_tim');

        $initiation = ChangeInitiation::factory()->create([
            'field_id' => $field->id,
            'initiator_id' => $initiator->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($initiator);

        $this->postJson("/api/changes/initiations/{$initiation->id}/approve")
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /**
     * Change: initiation initiator cannot reject their own initiation.
     */
    public function test_initiator_cannot_reject_own_initiation(): void
    {
        $field = Field::factory()->create();
        $initiator = $this->createUserWithRole('kepala_tim');

        $initiation = ChangeInitiation::factory()->create([
            'field_id' => $field->id,
            'initiator_id' => $initiator->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($initiator);

        $this->postJson("/api/changes/initiations/{$initiation->id}/reject", [
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
        $field = Field::factory()->create();
        $initiator = $this->createUserWithRole('staf');
        $reviewer = $this->createUserWithRole('kepala_tim');

        $initiation = ChangeInitiation::factory()->create([
            'field_id' => $field->id,
            'initiator_id' => $initiator->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($reviewer);

        $this->postJson("/api/changes/initiations/{$initiation->id}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');
    }

    /**
     * Change: rejected initiation can be revised back to draft.
     */
    public function test_rejected_initiation_can_be_revised_to_draft(): void
    {
        $field = Field::factory()->create();
        $initiator = $this->createUserWithRole('staf');

        $initiation = ChangeInitiation::factory()->create([
            'field_id' => $field->id,
            'initiator_id' => $initiator->id,
            'status' => 'rejected',
            'review_status' => 'rejected',
            'review_reason' => 'Needs more detail',
        ]);

        Sanctum::actingAs($initiator);

        $this->postJson("/api/changes/initiations/{$initiation->id}/revise")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'draft');
    }

    /**
     * Change: non-rejected initiation cannot be revised.
     */
    public function test_pending_initiation_cannot_be_revised(): void
    {
        $field = Field::factory()->create();
        $initiator = $this->createUserWithRole('staf');

        $initiation = ChangeInitiation::factory()->create([
            'field_id' => $field->id,
            'initiator_id' => $initiator->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($initiator);

        $this->postJson("/api/changes/initiations/{$initiation->id}/revise")
            ->assertStatus(422);
    }
}
