<?php

namespace Tests\Feature;

use App\Domains\ChangeManagement\Models\ChangeType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChangeTypeEndpointTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->user = User::factory()->create();
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/change-types')
            ->assertUnauthorized();
    }

    public function test_returns_all_change_types(): void
    {
        Sanctum::actingAs($this->user);

        ChangeType::factory(3)->create();

        $response = $this->getJson('/api/change-types');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name'],
                ],
            ]);
    }

    public function test_returns_correct_data_structure(): void
    {
        Sanctum::actingAs($this->user);

        $type = ChangeType::factory()->create(['name' => 'Hardware']);

        $response = $this->getJson('/api/change-types');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $type->id)
            ->assertJsonPath('data.0.name', 'Hardware');
    }

    public function test_excludes_soft_deleted_types(): void
    {
        Sanctum::actingAs($this->user);

        $active = ChangeType::factory()->create(['name' => 'Active Type']);
        ChangeType::factory()->create(['name' => 'Deleted Type'])->delete();

        $response = $this->getJson('/api/change-types');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active Type');
    }

    public function test_returns_empty_when_no_types(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/change-types')
            ->assertOk()
            ->assertJson(['data' => []]);
    }

    public function test_no_additional_permission_required(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/change-types')
            ->assertOk();
    }
}
