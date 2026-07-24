<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        Cache::flush();
    }

    private function createAdmin(): User
    {
        $field = Field::create(['name' => 'Bidang Test']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim Test']);

        $admin = User::create([
            'team_id' => $team->id,
            'name' => 'Admin Test',
            'nip' => '0000000001',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $admin->assignRole('admin');

        $field->update(['head_id' => $admin->id]);
        $team->update(['leader_id' => $admin->id]);

        return $admin;
    }

    private function createSupervisor(): User
    {
        $team = Team::first();

        $supervisor = User::create([
            'team_id' => $team->id,
            'name' => 'Supervisor Test',
            'nip' => '0000000002',
            'email' => 'supervisor@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $supervisor->assignRole('admin');

        return $supervisor;
    }

    public function test_auth_flow(): void
    {
        $this->createAdmin();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'user' => ['name', 'roles']]]);

        $token = $response->json('data.token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Admin Test');

        $this->postJson('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'wrong',
        ])->assertStatus(401);
    }

    public function test_wfh_report_full_flow(): void
    {
        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/wfh/reports', [
            'report_date' => '2026-07-10',
            'activities' => [
                [
                    'start_time' => '07:30',
                    'end_time' => '08:30',
                    'activity' => 'Rapat Bidang',
                    'links' => ['https://drive.google.com/test1'],
                ],
            ],
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $reportId = $response->json('data.id');

        $this->postJson("/api/wfh/reports/{$reportId}/submit")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'pending');

        $supervisor = $this->createSupervisor();
        Sanctum::actingAs($supervisor);

        $this->postJson("/api/wfh/reports/{$reportId}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        Sanctum::actingAs($admin);

        $this->putJson("/api/wfh/reports/{$reportId}", [
            'report_date' => '2026-07-10',
            'activities' => [['start_time' => '08:00', 'end_time' => '09:00', 'activity' => 'Changed']],
        ])
            ->assertStatus(422);
    }

    public function test_change_management_full_flow(): void
    {
        $admin = $this->createAdmin();
        $field = Field::first();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/changes', [
            'initiation' => [
                'field_id' => $field->id,
                'description' => 'Test change',
                'reason' => 'Testing',
            ],
            'implementation' => ['priority' => 'medium', 'impact' => 'low'],
        ]);
        $response->assertStatus(201)->assertJsonPath('success', true);
        $pkgId = $response->json('data.initiation.id');

        $typeId = \App\Domains\ChangeManagement\Models\ChangeType::create(['name' => 'Aplikasi'])->id;

        $this->postJson("/api/changes/{$pkgId}/submit", [
            'initiation' => ['field_id' => $field->id, 'description' => 'Test change', 'reason' => 'Testing', 'needed_by_date' => '2026-08-01'],
            'implementation' => ['priority' => 'medium', 'impact' => 'low', 'change_type_ids' => [$typeId], 'test_plan' => 'plan', 'execution_date' => '2026-08-10', 'release_date' => '2026-08-15', 'implementation_result' => 'Done', 'testing_result' => 'Pass'],
        ])->assertStatus(200)->assertJsonPath('data.initiation.status', 'pending');
        $supervisor = $this->createSupervisor();
        Sanctum::actingAs($supervisor);
        $this->postJson("/api/changes/{$pkgId}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.initiation.status', 'approved');
    }

    public function test_permission_boundary(): void
    {
        $this->createAdmin();

        $staf = User::create([
            'team_id' => Team::first()->id,
            'name' => 'Staf Test',
            'nip' => '0000000002',
            'email' => 'staf@test.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $staf->assignRole('staf');

        $stafToken = $this->postJson('/api/auth/login', [
            'email' => 'staf@test.com',
            'password' => 'password',
        ])->json('data.token');

        $this->withToken($stafToken)
            ->getJson('/api/admin/users')
            ->assertStatus(403);
    }
}
