<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeamUsersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_admin_sees_users_in_own_team(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        User::factory()->count(3)->create(['team_id' => $team->id]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/teams/'.$team->id.'/users')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(4, 'data') // admin + 3 users
            ->assertJsonStructure(['data' => [
                ['id', 'name', 'nip'],
            ]]);
    }

    public function test_admin_cannot_access_team_from_other_field(): void
    {
        $fieldA = Field::create(['name' => 'Bidang A']);
        $teamA = Team::create(['field_id' => $fieldA->id, 'name' => 'Tim A']);

        $fieldB = Field::create(['name' => 'Bidang B']);
        $teamB = Team::create(['field_id' => $fieldB->id, 'name' => 'Tim B']);

        $admin = User::factory()->create(['team_id' => $teamA->id]);
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/teams/'.$teamB->id.'/users')
            ->assertForbidden()
            ->assertJsonPath('message', 'Tim tidak ditemukan dalam bidang Anda.');
    }

    public function test_admin_without_field_gets_403(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => null]);
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/teams/'.$team->id.'/users')
            ->assertForbidden()
            ->assertJsonPath('message', 'Tim tidak ditemukan dalam bidang Anda.');
    }

    public function test_can_filter_by_active_users(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');

        User::factory()->create(['team_id' => $team->id, 'is_active' => true]);
        User::factory()->create(['team_id' => $team->id, 'is_active' => false]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/teams/'.$team->id.'/users?active=true')
            ->assertOk()
            ->assertJsonCount(2, 'data'); // admin (active) + 1 active user
    }

    public function test_unauthenticated_returns_401(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $this->getJson('/api/admin/teams/'.$team->id.'/users')
            ->assertUnauthorized();
    }

    public function test_non_admin_without_user_manage_permission_is_forbidden(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $staf = User::factory()->create(['team_id' => $team->id]);
        $staf->assignRole('staf'); // staf lacks permission:user.manage

        Sanctum::actingAs($staf);

        $this->getJson('/api/admin/teams/'.$team->id.'/users')
            ->assertForbidden();
    }

    public function test_nonexistent_team_returns_404(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/teams/999999/users')
            ->assertNotFound();
    }

    public function test_response_includes_pagination_meta(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        User::factory()->count(3)->create(['team_id' => $team->id]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/teams/'.$team->id.'/users?per_page=2')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 4)
            ->assertJsonCount(2, 'data'); // paginated to 2 items
    }

    public function test_per_page_capped_at_100(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        // Even with per_page=1000, response should cap to 100
        $this->getJson('/api/admin/teams/'.$team->id.'/users?per_page=1000')
            ->assertOk()
            ->assertJsonPath('meta.last_page', 1);
    }
}
