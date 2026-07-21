<?php

namespace Tests\Feature;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use App\Support\Constants\WfhSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeamExportPdfTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        config(['wfh.allowed_days' => [1, 2, 3, 4, 5, 6, 7]]);
    }

    public function test_returns_valid_pdf_with_headers(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);
        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        $user = User::factory()->create(['team_id' => $team->id]);
        WfhReport::create([
            'user_id' => $user->id, 'report_date' => '2026-07-17',
            'status' => 'pending', 'supervisor_id' => $admin->id,
        ]);

        Sanctum::actingAs($admin);
        $response = $this->get("/api/admin/wfh/teams/{$team->id}/pdf?date=2026-07-17");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_pdf_size_larger_when_attendance_photos_present(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);
        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        $user = User::factory()->create(['team_id' => $team->id, 'is_active' => true]);
        WfhReport::create([
            'user_id' => $user->id, 'report_date' => '2026-07-17',
            'status' => 'pending', 'supervisor_id' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        // PDF without attendance photos
        $res = $this->get("/api/admin/wfh/teams/{$team->id}/pdf?date=2026-07-17");
        $sizeWithout = strlen($res->getContent());

        // Store real test images and create attendance records
        foreach (WfhSession::ALL as $session) {
            $photo = UploadedFile::fake()->image("{$session}.jpg", 200, 200);
            $path = $photo->store("attendances/{$user->id}/2026-07-17", 'public');

            WfhAttendance::create([
                'user_id' => $user->id,
                'date' => '2026-07-17',
                'session' => $session,
                'photo_path' => $path,
                'check_in_at' => now(),
            ]);
        }

        // PDF with attendance photos
        $res = $this->get("/api/admin/wfh/teams/{$team->id}/pdf?date=2026-07-17");
        $sizeWith = strlen($res->getContent());

        $this->assertGreaterThan($sizeWithout + 1000, $sizeWith,
            'PDF should be significantly larger when attendance photos are included');
    }

    public function test_pdf_without_attendance_still_generates(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);
        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');

        // User with NO reports and NO attendance
        User::factory()->create([
            'team_id' => $team->id, 'is_active' => true,
            'name' => 'ANGGOTA TANPA LAPORAN',
        ]);

        Sanctum::actingAs($admin);
        $response = $this->get("/api/admin/wfh/teams/{$team->id}/pdf?date=2026-07-17");

        $response->assertOk();
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }
}
