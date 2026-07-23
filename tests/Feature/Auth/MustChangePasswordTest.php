<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MustChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }
    public function test_user_has_must_change_password_column_default_true(): void
    {
        $id = DB::table('users')->insertGetId([
            'name' => 'Test',
            'nip' => '0000000099',
            'email' => 'test@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $user = User::find($id);

        $this->assertTrue($user->must_change_password);
    }

    public function test_user_with_must_change_password_cannot_access_protected_endpoints(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->getJson('/api/profile')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Password harus diubah sebelum mengakses fitur ini.');
    }

    public function test_user_without_must_change_password_can_access_endpoints(): void
    {
        $user = User::factory()->create(['must_change_password' => false]);
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->getJson('/api/profile')
            ->assertStatus(200);
    }
}
