<?php

namespace Tests\Feature\Wfh;

use App\Domains\Wfh\Models\WfhReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UniqueActiveDraftTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);
    }

    public function test_reject_duplicate_active_draft(): void
    {
        $user = User::factory()->create();

        WfhReport::create([
            'user_id' => $user->id,
            'report_date' => '2026-07-27',
            'status' => 'draft',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);
        $this->expectExceptionCode(23505);

        WfhReport::create([
            'user_id' => $user->id,
            'report_date' => '2026-07-27',
            'status' => 'draft',
        ]);
    }

    public function test_reject_duplicate_rejected_report(): void
    {
        $user = User::factory()->create();

        WfhReport::create([
            'user_id' => $user->id,
            'report_date' => '2026-07-27',
            'status' => 'rejected',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);
        $this->expectExceptionCode(23505);

        WfhReport::create([
            'user_id' => $user->id,
            'report_date' => '2026-07-27',
            'status' => 'draft',
        ]);
    }

    public function test_allow_draft_and_approved_for_same_user_date(): void
    {
        $user = User::factory()->create();

        $draft = WfhReport::create([
            'user_id' => $user->id,
            'report_date' => '2026-07-27',
            'status' => 'draft',
        ]);

        $approved = WfhReport::create([
            'user_id' => $user->id,
            'report_date' => '2026-07-27',
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('wfh_reports', ['id' => $draft->id]);
        $this->assertDatabaseHas('wfh_reports', ['id' => $approved->id]);
    }
}