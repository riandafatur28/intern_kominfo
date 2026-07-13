<?php

namespace Tests\Feature;

use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityRegressionTest extends TestCase
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
     * C2 regression: user without view permission cannot list initiations.
     */
    public function test_user_without_view_permission_cannot_list_initiations(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/changes/initiations')
            ->assertStatus(403);
    }

    /**
     * C2 regression: user without view permission cannot view a specific initiation.
     */
    public function test_user_without_view_permission_cannot_view_initiation(): void
    {
        $field = Field::factory()->create();
        $initiator = $this->createUserWithRole('staf');
        $user = User::factory()->create();

        $initiation = ChangeInitiation::factory()->create([
            'field_id' => $field->id,
            'initiator_id' => $initiator->id,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/changes/initiations/{$initiation->id}")
            ->assertStatus(403);
    }

    /**
     * R1 regression: user cannot update an implementation they didn't create.
     */
    public function test_user_cannot_update_other_users_implementation(): void
    {
        $field = Field::factory()->create();
        $team = Team::factory()->create(['field_id' => $field->id]);
        $creator = $this->createUserWithRole('staf', $team);
        $other = $this->createUserWithRole('staf', $team);

        $initiation = ChangeInitiation::factory()->create([
            'field_id' => $field->id,
            'initiator_id' => $creator->id,
            'status' => 'approved',
        ]);

        Sanctum::actingAs($creator);

        $implResponse = $this->postJson("/api/changes/initiations/{$initiation->id}/implementations", [
            'priority' => 'medium',
            'impact' => 'low',
            'resources' => '2 org',
        ])
            ->assertStatus(201);

        $implId = $implResponse->json('data.id');

        Sanctum::actingAs($other);

        $this->putJson("/api/changes/implementations/{$implId}", [
            'priority' => 'high',
        ])
            ->assertStatus(403);
    }

    /**
     * R5 regression: attendance check-in with a backdated date is rejected.
     */
    public function test_attendance_rejects_backdated_date(): void
    {
        $user = $this->createUserWithRole('staf');
        Sanctum::actingAs($user);

        $yesterday = now()->subDay()->toDateString();

        $this->postJson('/api/wfh/attendance', [
            'date' => $yesterday,
        ])
            ->assertStatus(422);
    }

    /**
     * C1 regression: a valid-format but nonexistent verification token returns 404.
     */
    public function test_qr_verification_rejects_nonexistent_token(): void
    {
        $token = bin2hex(random_bytes(32));

        $this->getJson("/api/verify/{$token}")
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }
}
