<?php

namespace Tests\Feature\Wfh;

use App\Domains\Wfh\Models\WfhReport;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KbSelfApproveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_kb_can_approve_own_report(): void
    {
        $field = Field::create(['name' => 'Bidang Test']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim Test']);

        $kb = User::factory()->create(['team_id' => $team->id]);
        $kb->assignRole('kepala_bidang');

        $field->update(['head_id' => $kb->id]);

        $report = WfhReport::factory()->create([
            'user_id' => $kb->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($kb);

        $this->postJson("/api/wfh/reports/{$report->id}/approve")
            ->assertStatus(200);
    }

    public function test_non_kb_can_approve_own_report_since_guard_removed(): void
    {
        $field = Field::create(['name' => 'Bidang Test']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim Test']);

        $staf = User::factory()->create(['team_id' => $team->id]);
        $staf->assignRole('staf');
        $staf->givePermissionTo('wfh.report.approve');

        $report = WfhReport::factory()->create([
            'user_id' => $staf->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($staf);

        $this->postJson("/api/wfh/reports/{$report->id}/approve")
            ->assertStatus(200);
    }
}
