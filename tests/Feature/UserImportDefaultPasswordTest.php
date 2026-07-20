<?php

namespace Tests\Feature;

use App\Support\Import\UserImport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserImportDefaultPasswordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_imported_user_receives_default_password_from_env(): void
    {
        $import = new UserImport;

        $user = $import->model([
            'nama' => 'Import Staf',
            'nip' => '1234567890',
            'email' => 'import.staf@test.com',
        ]);

        $this->assertNotNull($user);
        $user->save();

        $this->assertTrue(Hash::check(config('app.default_user_password'), $user->fresh()->password));
    }

    public function test_imported_user_has_must_change_password_flag_true(): void
    {
        $import = new UserImport;

        $user = $import->model([
            'nama' => 'Import Staf',
            'nip' => '1234567890',
            'email' => 'import.staf@test.com',
        ]);

        $this->assertNotNull($user);
        $this->assertTrue($user->must_change_password);
    }

    public function test_imported_user_can_login_with_default_password(): void
    {
        $import = new UserImport;

        $user = $import->model([
            'nama' => 'Import Staf',
            'nip' => '1234567890',
            'email' => 'import.staf@test.com',
        ]);
        $user->save();

        $this->postJson('/api/auth/login', [
            'email' => 'import.staf@test.com',
            'password' => config('app.default_user_password'),
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.must_change_password', true);
    }

    public function test_imported_user_cannot_login_with_old_random_password_pattern(): void
    {
        // Regression guard: pre-fix code used Str::random(12) — opaque to the operator.
        // The user MUST be able to log in with the env-controlled default.
        $import = new UserImport;

        $user = $import->model([
            'nama' => 'Import Staf',
            'nip' => '1234567890',
            'email' => 'import.staf@test.com',
        ]);
        $user->save();

        // Any 12-char random string is astronomically unlikely to match Kominfo@123
        $this->assertFalse(Hash::check('XYabcd123456', $user->fresh()->password));
    }
}
