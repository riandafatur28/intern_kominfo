<?php

namespace Tests\Feature\Wfh;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UnifiedReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);
    }

    public function test_create_report_with_3_photos_and_2_activities(): void
    {
        $user = User::factory()->create();
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->postJson('/api/wfh/reports', [
            'report_date' => now()->toDateString(),
            'attendances' => [
                'pagi' => ['photo' => UploadedFile::fake()->image('pagi.jpg')],
                'siang' => ['photo' => UploadedFile::fake()->image('siang.jpg')],
                'sore' => ['photo' => UploadedFile::fake()->image('sore.jpg')],
            ],
            'activities' => [
                ['activity' => 'Morning task', 'start_time' => '08:00', 'end_time' => '10:00'],
                ['activity' => 'Afternoon task', 'start_time' => '13:00', 'end_time' => '15:00'],
            ],
        ])
            ->assertStatus(201);

        $report = $user->wfhReports()->first();
        $this->assertNotNull($report);
        $this->assertCount(3, $report->attendances);
        $this->assertCount(2, $report->activities);
    }

    public function test_submit_empty_draft_returns_422(): void
    {
        $user = User::factory()->create();
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        // Create empty draft
        $response = $this->postJson('/api/wfh/reports', [
            'report_date' => now()->toDateString(),
        ]);
        $reportId = $response->json('data.id');

        // Submit via explicit endpoint
        $this->postJson("/api/wfh/reports/{$reportId}/submit")
            ->assertStatus(422);
    }

    public function test_create_report_draft_without_photos_and_activities_succeeds(): void
    {
        $user = User::factory()->create();
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->postJson('/api/wfh/reports', [
            'report_date' => now()->toDateString(),
            'status' => 'draft',
        ])
            ->assertStatus(201);

        $report = $user->wfhReports()->first();
        $this->assertNotNull($report);
        $this->assertEquals('draft', $report->status);
    }

    public function test_create_report_submit_with_photos_only_succeeds(): void
    {
        $user = User::factory()->create();
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $this->postJson('/api/wfh/reports', [
            'report_date' => now()->toDateString(),
            'status' => 'submit',
            'attendances' => [
                'pagi' => ['photo' => UploadedFile::fake()->image('pagi.jpg')],
                'siang' => ['photo' => UploadedFile::fake()->image('siang.jpg')],
                'sore' => ['photo' => UploadedFile::fake()->image('sore.jpg')],
            ],
        ])
            ->assertStatus(201);
    }

    public function test_update_report_metadata_only_preserves_attendances(): void
    {
        $user = User::factory()->create();
        $user->assignRole('staf');
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/wfh/reports', [
            'report_date' => now()->toDateString(),
            'attendances' => [
                'pagi' => ['photo' => UploadedFile::fake()->image('pagi.jpg')],
                'sore' => ['photo' => UploadedFile::fake()->image('sore.jpg')],
            ],
        ]);
        $reportId = $response->json('data.id');

        // PUT is metadata-only — attendances in body are ignored, existing preserved
        $this->putJson("/api/wfh/reports/{$reportId}", [
            'report_date' => now()->toDateString(),
        ])->assertStatus(200);

        $report = $user->wfhReports()->with('attendances')->first();
        $this->assertCount(2, $report->attendances, 'Attendances should be preserved');
    }

    public function test_update_report_cannot_modify_others_report(): void
    {
        $owner = User::factory()->create();
        $owner->assignRole('staf');
        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/wfh/reports', [
            'report_date' => now()->toDateString(),
        ]);
        $reportId = $response->json('data.id');

        $intruder = User::factory()->create();
        $intruder->assignRole('staf');
        Sanctum::actingAs($intruder);

        $this->putJson("/api/wfh/reports/{$reportId}", [
            'report_date' => now()->toDateString(),
        ])->assertStatus(403);
    }
}
