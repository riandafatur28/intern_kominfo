<?php

namespace Tests\Feature\Wfh;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WfhMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_admin_can_view_monitoring_for_all_teams(): void
    {
        $field = Field::factory()->create();
        $team = Team::factory()->create(['field_id' => $field->id]);
        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/wfh/monitoring')
            ->assertStatus(200)
            ->assertJsonStructure(['success', 'data' => ['date', 'team_id', 'not_checked_in', 'no_report']]);
    }

    public function test_kepala_bidang_can_view_monitoring(): void
    {
        // RED: previously crashed with "Call to undefined method User::ledTeams()"
        // because WfhMonitoringController calls $user->ledTeams() for non-admin users
        // and the User model didn't define the relation.
        $field = Field::factory()->create();
        $team = Team::factory()->create(['field_id' => $field->id]);
        $kb = User::factory()->create(['team_id' => $team->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);

        Sanctum::actingAs($kb);

        $this->getJson('/api/admin/wfh/monitoring')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_kepala_bidang_sees_entire_field(): void
    {
        $field = Field::factory()->create();
        $teamA = Team::factory()->create(['field_id' => $field->id, 'name' => 'Tim A']);
        $teamB = Team::factory()->create(['field_id' => $field->id, 'name' => 'Tim B']);

        $kb = User::factory()->create(['team_id' => $teamA->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);

        Sanctum::actingAs($kb);

        $response = $this->getJson('/api/admin/wfh/monitoring')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // Field scope → team_id should be null (entire field, not one team)
        $this->assertNull($response->json('data.team_id'),
            'KB field head harus lihat seluruh bidang (team_id=null)');
    }

    public function test_kepala_tim_still_sees_only_own_team(): void
    {
        $field = Field::factory()->create();
        $teamA = Team::factory()->create(['field_id' => $field->id, 'name' => 'Tim A']);
        $teamB = Team::factory()->create(['field_id' => $field->id, 'name' => 'Tim B']);

        $kt = User::factory()->create(['team_id' => $teamA->id]);
        $kt->assignRole('kepala_tim');
        $teamA->update(['leader_id' => $kt->id]);

        Sanctum::actingAs($kt);

        $response = $this->getJson('/api/admin/wfh/monitoring')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // KT tetap scoped team → team_id = teamA
        $this->assertEquals($teamA->id, $response->json('data.team_id'),
            'Kepala tim harus tetap scoped ke tim sendiri');
    }

    public function test_kepala_bidang_cannot_view_other_field_team_via_query_param(): void
    {
        $fieldA = Field::factory()->create(['name' => 'Bidang A']);
        $teamA = Team::factory()->create(['field_id' => $fieldA->id, 'name' => 'Tim A']);
        $fieldB = Field::factory()->create(['name' => 'Bidang B']);
        $teamB = Team::factory()->create(['field_id' => $fieldB->id, 'name' => 'Tim B']);

        $kb = User::factory()->create(['team_id' => $teamA->id]);
        $kb->assignRole('kepala_bidang');
        $fieldA->update(['head_id' => $kb->id]);

        Sanctum::actingAs($kb);

        // KB Bidang A coba filter ke tim di Bidang B → harus 403 (cross-field leak)
        $this->getJson("/api/admin/wfh/monitoring?team_id={$teamB->id}")
            ->assertStatus(403);
    }

    public function test_kepala_bidang_can_filter_own_team_in_field(): void
    {
        $field = Field::factory()->create();
        $teamA = Team::factory()->create(['field_id' => $field->id, 'name' => 'Tim A']);
        $teamB = Team::factory()->create(['field_id' => $field->id, 'name' => 'Tim B']);

        $kb = User::factory()->create(['team_id' => $teamA->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);

        Sanctum::actingAs($kb);

        // KB filter tim di bidang sendiri → 200, team_id set
        $this->getJson("/api/admin/wfh/monitoring?team_id={$teamA->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.team_id', $teamA->id);
    }

    public function test_kepala_tim_can_view_monitoring(): void
    {
        $field = Field::factory()->create();
        $team = Team::factory()->create(['field_id' => $field->id]);
        $kt = User::factory()->create(['team_id' => $team->id]);
        $kt->assignRole('kepala_tim');
        $team->update(['leader_id' => $kt->id]);

        Sanctum::actingAs($kt);

        $this->getJson('/api/admin/wfh/monitoring')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_staf_cannot_view_monitoring(): void
    {
        $field = Field::factory()->create();
        $team = Team::factory()->create(['field_id' => $field->id]);
        $staf = User::factory()->create(['team_id' => $team->id]);
        $staf->assignRole('staf');

        Sanctum::actingAs($staf);

        $this->getJson('/api/admin/wfh/monitoring')
            ->assertStatus(403);
    }
}
