<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeamsByFieldTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Field $fieldA;

    private Field $fieldB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);

        $this->fieldA = Field::create(['name' => 'Bidang Aplikasi']);
        $this->fieldB = Field::create(['name' => 'Bidang Jaringan']);

        Team::create(['field_id' => $this->fieldA->id, 'name' => 'Tim Aplikasi 1']);
        Team::create(['field_id' => $this->fieldA->id, 'name' => 'Tim Aplikasi 2']);
        Team::create(['field_id' => $this->fieldB->id, 'name' => 'Tim Jaringan 1']);

        $this->admin = User::create([
            'team_id' => null,
            'name' => 'Admin',
            'nip' => '0000000001',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $this->admin->assignRole('admin');
    }

    public function test_admin_without_filter_gets_all_teams(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/teams');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_filter_teams_by_field_id(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("/api/admin/teams?field_id={$this->fieldA->id}");

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.field.id', $this->fieldA->id);
    }

    public function test_filter_with_unknown_field_id_returns_empty_list(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/teams?field_id=9999');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/admin/teams')->assertUnauthorized();
    }

    public function test_user_without_user_manage_permission_is_forbidden(): void
    {
        $staf = User::create([
            'team_id' => null,
            'name' => 'Staf',
            'nip' => '0000000002',
            'email' => 'staf@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $staf->assignRole('staf');

        Sanctum::actingAs($staf);

        $this->getJson('/api/admin/teams')->assertForbidden();
    }
}
