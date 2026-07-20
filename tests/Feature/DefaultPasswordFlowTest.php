<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DefaultPasswordFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Team $team;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);

        $field = Field::create(['name' => 'Bidang Test']);
        $this->team = Team::create(['field_id' => $field->id, 'name' => 'Tim Test']);

        $this->admin = User::create([
            'team_id' => $this->team->id,
            'name' => 'Admin',
            'nip' => '0000000001',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $this->admin->assignRole('admin');
    }

    public function test_admin_creates_user_without_password_field(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'Staf Baru',
            'nip' => '1234567890',
            'email' => 'staf.baru@test.com',
            'team_id' => $this->team->id,
            'roles' => ['staf'],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'email' => 'staf.baru@test.com',
            'must_change_password' => true,
        ]);
    }

    public function test_created_user_can_login_with_default_password_from_env(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/admin/users', [
            'name' => 'Staf Baru',
            'nip' => '1234567890',
            'email' => 'staf.baru@test.com',
            'team_id' => $this->team->id,
            'roles' => ['staf'],
        ])->assertStatus(201);

        // The user must be able to log in with the env-controlled default password
        $this->postJson('/api/auth/login', [
            'email' => 'staf.baru@test.com',
            'password' => config('app.default_user_password'),
        ])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.must_change_password', true);
    }

    public function test_password_field_sent_by_client_is_ignored_not_required(): void
    {
        Sanctum::actingAs($this->admin);

        // Client sends a password; backend must ignore it and use the default
        $this->postJson('/api/admin/users', [
            'name' => 'Staf Baru',
            'nip' => '1234567890',
            'email' => 'staf.baru@test.com',
            'team_id' => $this->team->id,
            'roles' => ['staf'],
            'password' => 'ClientProvidedPassword!23',
        ])->assertStatus(201);

        $user = User::where('email', 'staf.baru@test.com')->first();
        $this->assertTrue(Hash::check(config('app.default_user_password'), $user->password));
        $this->assertFalse(Hash::check('ClientProvidedPassword!23', $user->password));
    }

    public function test_changing_env_var_changes_password_for_new_users_without_code_change(): void
    {
        // Simulate rotating the env var at runtime
        config(['app.default_user_password' => 'RotatedEnvPwd!9']);

        Sanctum::actingAs($this->admin);

        $this->postJson('/api/admin/users', [
            'name' => 'Staf Rotasi',
            'nip' => '9999999999',
            'email' => 'staf.rotasi@test.com',
            'team_id' => $this->team->id,
            'roles' => ['staf'],
        ])->assertStatus(201);

        $user = User::where('email', 'staf.rotasi@test.com')->first();
        $this->assertTrue(Hash::check('RotatedEnvPwd!9', $user->password));
        $this->assertFalse(Hash::check('Kominfo@123', $user->password));
    }
}
