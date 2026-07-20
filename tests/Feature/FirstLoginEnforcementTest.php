<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FirstLoginEnforcementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    private function createUserWithFlag(bool $mustChange): User
    {
        $field = Field::create(['name' => 'Bidang Test']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim Test']);

        return User::create([
            'team_id' => $team->id,
            'name' => 'Staf Baru',
            'nip' => '1234567890',
            'email' => 'staf.baru@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
            'must_change_password' => $mustChange,
        ]);
    }

    public function test_user_with_pending_password_change_is_blocked_from_protected_routes(): void
    {
        $user = $this->createUserWithFlag(true);
        Sanctum::actingAs($user);

        $this->getJson('/api/profile')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'must_change_password');
    }

    public function test_user_with_cleared_password_change_can_access_protected_routes(): void
    {
        $user = $this->createUserWithFlag(false);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->getJson('/api/profile')->assertStatus(200);
    }

    public function test_change_password_endpoint_remains_reachable_while_flag_true(): void
    {
        $user = $this->createUserWithFlag(true);
        Sanctum::actingAs($user);

        $this->postJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'NewSecret!23',
            'password_confirmation' => 'NewSecret!23',
        ])->assertStatus(200);
    }

    public function test_auth_me_remains_reachable_while_flag_true(): void
    {
        $user = $this->createUserWithFlag(true);
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/me')->assertStatus(200);
    }

    public function test_auth_logout_remains_reachable_while_flag_true(): void
    {
        $user = $this->createUserWithFlag(true);
        Sanctum::actingAs($user);

        $this->postJson('/api/auth/logout')->assertStatus(200);
    }

    public function test_successful_password_change_clears_must_change_password_flag(): void
    {
        $user = $this->createUserWithFlag(true);
        Sanctum::actingAs($user);

        $this->postJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'NewSecret!23',
            'password_confirmation' => 'NewSecret!23',
        ])->assertStatus(200);

        $this->assertFalse($user->fresh()->must_change_password);
    }

    public function test_after_password_change_protected_routes_become_accessible(): void
    {
        $user = $this->createUserWithFlag(true);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        // Confirm blocked before
        $this->getJson('/api/profile')->assertStatus(403);

        // Change password
        $this->postJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'NewSecret!23',
            'password_confirmation' => 'NewSecret!23',
        ])->assertStatus(200);

        // Now accessible
        $this->getJson('/api/profile')->assertStatus(200);
    }

    public function test_guest_is_still_unauthenticated_not_forbidden(): void
    {
        // Unauthenticated requests should hit 401 (auth middleware), not 403 (password.changed)
        $this->getJson('/api/profile')->assertStatus(401);
    }
}
