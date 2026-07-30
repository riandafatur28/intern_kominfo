<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EvaluatorSelectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_implementation_defaults_evaluator_to_self_when_not_provided(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $creator = User::factory()->create(['team_id' => $team->id]);
        $creator->assignRole('staf');

        Sanctum::actingAs($creator);

        $response = $this->postJson('/api/changes', [
            'initiation' => [
                'field_id' => $field->id,
                'description' => 'Test change',
                'reason' => 'Testing',
            ],
            'implementation' => [
                'priority' => 'medium',
                'impact' => 'low',
            ],
        ]);

        $response->assertStatus(201);
        // ponytail: new package flow does NOT auto-default evaluator_id to the creator
        // (unlike the old serial flow). FE must send evaluator_id explicitly when needed.
        $this->assertNull($response->json('data.implementation.evaluator_id'));
    }

    public function test_implementation_accepts_evaluator_from_same_field(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $creator = User::factory()->create(['team_id' => $team->id]);
        $creator->assignRole('staf');

        $evaluator = User::factory()->create(['team_id' => $team->id]);
        $evaluator->assignRole('staf');

        Sanctum::actingAs($creator);

        $response = $this->postJson('/api/changes', [
            'initiation' => [
                'field_id' => $field->id,
                'description' => 'Test change',
                'reason' => 'Testing',
            ],
            'implementation' => [
                'priority' => 'medium',
                'impact' => 'low',
                'evaluator_id' => $evaluator->id,
            ],
        ]);

        $response->assertStatus(201);
        $this->assertEquals($evaluator->id, $response->json('data.implementation.evaluator_id'));
    }

    public function test_implementation_rejects_evaluator_from_different_field(): void
    {
        $fieldA = Field::create(['name' => 'Bidang A']);
        $teamA = Team::create(['field_id' => $fieldA->id, 'name' => 'Tim A']);
        $fieldB = Field::create(['name' => 'Bidang B']);
        $teamB = Team::create(['field_id' => $fieldB->id, 'name' => 'Tim B']);

        $creator = User::factory()->create(['team_id' => $teamA->id]);
        $creator->assignRole('staf');

        $otherFieldUser = User::factory()->create(['team_id' => $teamB->id]);

        Sanctum::actingAs($creator);

        $this->postJson('/api/changes', [
            'initiation' => [
                'field_id' => $fieldA->id,
                'description' => 'Test change',
                'reason' => 'Testing',
            ],
            'implementation' => [
                'evaluator_id' => $otherFieldUser->id,
            ],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['implementation.evaluator_id']);
    }

    public function test_submit_rejects_evaluator_from_different_field(): void
    {
        $fieldA = Field::create(['name' => 'Bidang A']);
        $teamA = Team::create(['field_id' => $fieldA->id, 'name' => 'Tim A']);
        $fieldB = Field::create(['name' => 'Bidang B']);
        $teamB = Team::create(['field_id' => $fieldB->id, 'name' => 'Tim B']);

        $creator = User::factory()->create(['team_id' => $teamA->id]);
        $creator->assignRole('staf');
        $otherFieldUser = User::factory()->create(['team_id' => $teamB->id]);

        Sanctum::actingAs($creator);

        // Create a minimal draft first
        $pkg = $this->postJson('/api/changes', [
            'initiation' => [
                'field_id' => $fieldA->id,
                'description' => 'Test',
                'reason' => 'Testing',
            ],
            'implementation' => ['priority' => 'low', 'impact' => 'low'],
        ])->json('data.initiation');

        // Submit with a cross-field evaluator → should fail validation
        $this->postJson("/api/changes/{$pkg['id']}/submit", [
            'initiation' => [
                'field_id' => $fieldA->id,
                'description' => 'Test',
                'reason' => 'Testing',
                'needed_by_date' => '2026-09-01',
            ],
            'implementation' => [
                'priority' => 'medium',
                'impact' => 'low',
                'change_type_ids' => [],
                'test_plan' => 'plan',
                'execution_date' => '2026-09-10',
                'release_date' => '2026-09-15',
                'implementation_result' => 'Done',
                'testing_result' => 'Pass',
                'evaluator_id' => $otherFieldUser->id,
            ],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['implementation.evaluator_id']);
    }
}
