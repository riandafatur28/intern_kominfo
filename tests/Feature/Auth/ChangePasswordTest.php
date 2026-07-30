<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_login_response_includes_must_change_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
            'must_change_password' => true,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['must_change_password'],
                ],
            ])
            ->assertJsonPath('data.user.must_change_password', true);
    }

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
            'must_change_password' => true,
        ]);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        // Change password
        $this->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // must_change_password should now be false
        $user->refresh();
        $this->assertFalse($user->must_change_password);

        // Can now access protected endpoints
        $this->getJson('/api/profile')
            ->assertStatus(200);
    }

    public function test_change_password_with_wrong_current_returns_422(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('realpassword'),
            'must_change_password' => true,
        ]);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->postJson('/api/auth/change-password', [
            'current_password' => 'wrongpassword',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_change_password_validates_new_password_min_length(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
            'must_change_password' => true,
        ]);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'short',
            'new_password_confirmation' => 'short',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_validates_confirmation(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
            'must_change_password' => true,
        ]);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'different',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }
}
