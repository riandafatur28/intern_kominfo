<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\KepalaBidangUserSeeder;
use Database\Seeders\KepalaTimUserSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\StafUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleSeedersTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_produces_four_role_users_with_expected_emails(): void
    {
        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class]);

        $this->assertDatabaseHas('users', ['email' => 'admin@kominfo.go.id']);
        $this->assertDatabaseHas('users', ['email' => 'kepala.bidang@kominfo.go.id']);
        $this->assertDatabaseHas('users', ['email' => 'kepala.tim@kominfo.go.id']);
        $this->assertDatabaseHas('users', ['email' => 'staf@kominfo.go.id']);
    }

    public function test_each_seeded_user_has_its_expected_role(): void
    {
        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class]);

        $this->assertTrue(User::where('email', 'admin@kominfo.go.id')->first()->hasRole('admin'));
        $this->assertTrue(User::where('email', 'kepala.bidang@kominfo.go.id')->first()->hasRole('kepala_bidang'));
        $this->assertTrue(User::where('email', 'kepala.tim@kominfo.go.id')->first()->hasRole('kepala_tim'));
        $this->assertTrue(User::where('email', 'staf@kominfo.go.id')->first()->hasRole('staf'));
    }

    public function test_seeded_admin_must_change_password_on_first_login(): void
    {
        // Regression for review Critical-1: admin bootstrap must not bypass first-login enforcement.
        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class]);

        $admin = User::where('email', 'admin@kominfo.go.id')->first();
        $this->assertTrue($admin->must_change_password);
    }

    public function test_kepala_bidang_seeder_assigns_field_head_when_head_id_empty(): void
    {
        $this->artisan('db:seed', ['--class' => RolePermissionSeeder::class]);
        $this->artisan('db:seed', ['--class' => AdminUserSeeder::class]);
        // Admin seeder already sets field.head_id to admin — so kepala_bidang must not steal it.
        $this->artisan('db:seed', ['--class' => KepalaBidangUserSeeder::class]);

        $kb = User::where('email', 'kepala.bidang@kominfo.go.id')->first();
        $this->assertNotNull($kb);
        $this->assertTrue($kb->hasRole('kepala_bidang'));
    }

    public function test_kepala_tim_seeder_assigns_team_leader_when_leader_id_empty(): void
    {
        $this->artisan('db:seed', ['--class' => RolePermissionSeeder::class]);
        $this->artisan('db:seed', ['--class' => AdminUserSeeder::class]);
        $this->artisan('db:seed', ['--class' => KepalaTimUserSeeder::class]);

        $kt = User::where('email', 'kepala.tim@kominfo.go.id')->first();
        $this->assertNotNull($kt);
        $this->assertTrue($kt->hasRole('kepala_tim'));
    }

    public function test_staf_seeder_creates_staf_user(): void
    {
        $this->artisan('db:seed', ['--class' => RolePermissionSeeder::class]);
        $this->artisan('db:seed', ['--class' => AdminUserSeeder::class]);
        $this->artisan('db:seed', ['--class' => StafUserSeeder::class]);

        $staf = User::where('email', 'staf@kominfo.go.id')->first();
        $this->assertNotNull($staf);
        $this->assertTrue($staf->hasRole('staf'));
    }
}
