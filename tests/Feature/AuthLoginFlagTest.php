<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthLoginFlagTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        Cache::flush();
    }

    private function seedUserWithFlag(bool $mustChange): User
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

    public function test_login_response_emits_must_change_password_true_for_new_user(): void
    {
        $this->seedUserWithFlag(true);

        $this->postJson('/api/auth/login', [
            'email' => 'staf.baru@test.com',
            'password' => 'password',
        ])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.must_change_password', true)
            ->assertJsonPath('data.user.must_change_password', true);
    }

    public function test_login_response_emits_must_change_password_false_for_cleared_user(): void
    {
        $this->seedUserWithFlag(false);

        $this->postJson('/api/auth/login', [
            'email' => 'staf.baru@test.com',
            'password' => 'password',
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.must_change_password', false)
            ->assertJsonPath('data.user.must_change_password', false);
    }

    public function test_auth_me_includes_must_change_password_flag(): void
    {
        $user = $this->seedUserWithFlag(true);
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.must_change_password', true);
    }
}
