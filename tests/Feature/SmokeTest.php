<?php

namespace Tests\Feature;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
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
        $this->createAdmin();
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ])->json('data.token');

        $response = $this->withToken($token)->postJson('/api/wfh/reports', [
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

        $this->withToken($token)
            ->postJson("/api/wfh/reports/{$reportId}/submit")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'pending');

        $this->withToken($token)
            ->postJson("/api/wfh/reports/{$reportId}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $this->withToken($token)
            ->putJson("/api/wfh/reports/{$reportId}", [
                'report_date' => '2026-07-10',
                'activities' => [['start_time' => '08:00', 'end_time' => '09:00', 'activity' => 'Changed']],
            ])
            ->assertStatus(422);
    }

    public function test_change_management_full_flow(): void
    {
        $this->createAdmin();
        $field = Field::first();
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ])->json('data.token');

        $response = $this->withToken($token)->postJson('/api/changes/initiations', [
            'field_id' => $field->id,
            'description' => 'Test change',
            'reason' => 'Testing',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $initId = $response->json('data.id');

        $this->withToken($token)
            ->postJson("/api/changes/initiations/{$initId}/submit")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'pending');

        $this->withToken($token)
            ->postJson("/api/changes/initiations/{$initId}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $implResponse = $this->withToken($token)->postJson("/api/changes/initiations/{$initId}/implementations", [
            'priority' => 'medium',
            'impact' => 'low',
            'resources' => '2 org',
        ]);

        $implResponse->assertStatus(201);
        $implId = $implResponse->json('data.id');

        $this->withToken($token)
            ->postJson("/api/changes/implementations/{$implId}/submit")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'submitted');

        $this->withToken($token)
            ->postJson("/api/changes/implementations/{$implId}/review", [
                'review_status' => 'diterima',
                'execution_date' => '2026-07-15',
                'release_date' => '2026-07-16',
                'implementation_result' => 'Implementasi selesai',
                'testing_result' => 'Pengujian lulus',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.review_status', 'diterima');
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
