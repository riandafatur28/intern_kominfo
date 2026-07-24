<?php

namespace Tests\Feature\Organization;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeamEndpointTest extends TestCase
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
        $this->getJson('/api/teams')
            ->assertUnauthorized();
    }

    public function test_returns_all_teams(): void
    {
        Sanctum::actingAs($this->user);

        Team::factory(3)->create();

        $response = $this->getJson('/api/teams');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'leader_id', 'field_id'],
                ],
            ]);
    }

    public function test_filter_by_field_id(): void
    {
        Sanctum::actingAs($this->user);

        $fieldA = Field::factory()->create();
        $fieldB = Field::factory()->create();

        Team::factory(2)->create(['field_id' => $fieldA->id]);
        Team::factory(3)->create(['field_id' => $fieldB->id]);

        $response = $this->getJson('/api/teams?field_id=' . $fieldA->id);

        $response->assertOk()
            ->assertJsonCount(2, 'data');

        foreach ($response->json('data') as $team) {
            $this->assertEquals($fieldA->id, $team['field_id']);
        }
    }

    public function test_returns_empty_when_no_teams(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/teams')
            ->assertOk()
            ->assertJson(['data' => []]);
    }
}