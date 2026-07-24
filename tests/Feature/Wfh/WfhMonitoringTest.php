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
