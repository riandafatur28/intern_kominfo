<?php

namespace Tests\Feature\Organization;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserCreateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);
    }

    public function test_create_user_without_password_uses_setting_default(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/users', [
            'name' => 'New User',
            'nip' => '0000000100',
            'email' => 'new@test.com',
            'roles' => ['staf'],
        ])
            ->assertStatus(201);

        $user = User::where('email', 'new@test.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->must_change_password);
        $this->assertTrue(Hash::check(Setting::get('password_default_user', 'user1234'), $user->password));
    }

    public function test_create_admin_without_password_uses_admin_default(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/users', [
            'name' => 'New Admin',
            'nip' => '0000000101',
            'email' => 'newadmin@test.com',
            'roles' => ['admin'],
        ])
            ->assertStatus(201);

        $user = User::where('email', 'newadmin@test.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check(Setting::get('password_default_admin', 'admin123'), $user->password));
    }

    public function test_create_user_with_custom_password_uses_custom(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/users', [
            'name' => 'Custom Pwd',
            'nip' => '0000000102',
            'email' => 'custom@test.com',
            'password' => 'MyCustomPass123',
            'roles' => ['staf'],
        ])
            ->assertStatus(201);

        $user = User::where('email', 'custom@test.com')->first();
        $this->assertTrue($user->must_change_password);
        $this->assertTrue(Hash::check('MyCustomPass123', $user->password));
    }
}
