<?php

namespace Tests\Feature\Wfh;

use App\Domains\Wfh\Models\WfhTeamReport;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\View;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeamReportPdfTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_team_pdf_hides_kb_signature_when_team_report_pending(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $teamReport = WfhTeamReport::create([
            'team_id' => $team->id,
            'report_date' => now()->toDateString(),
            'status' => 'pending',
            'created_by' => $admin->id,
        ]);

        $captured = $this->capturePdfViewData($team, $teamReport->id);

        $this->assertFalse($captured['isApproved']);
        $this->assertNull($captured['signatureSupervisorPath']);
    }

    public function test_team_pdf_shows_kb_signature_when_team_report_approved(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $kb = User::factory()->create(['team_id' => $team->id]);
        $kb->assignRole('kepala_bidang');
        $field->update(['head_id' => $kb->id]);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $teamReport = WfhTeamReport::create([
            'team_id' => $team->id,
            'report_date' => now()->toDateString(),
            'status' => 'approved',
            'created_by' => $admin->id,
            'supervisor_id' => $kb->id,
            'supervisor_signed_at' => now(),
        ]);

        $captured = $this->capturePdfViewData($team, $teamReport->id);

        $this->assertTrue($captured['isApproved']);
        $this->assertNotNull($captured['signatureSupervisorPath']);
    }

    public function test_team_pdf_without_team_report_id_hides_kb_signature(): void
    {
        $field = Field::create(['name' => 'Bidang A']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim A']);

        $admin = User::factory()->create(['team_id' => $team->id]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $captured = $this->capturePdfViewData($team, null);

        $this->assertFalse($captured['isApproved']);
        $this->assertNull($captured['signatureSupervisorPath']);
    }

    /**
     * @return array<string, mixed>
     */
    private function capturePdfViewData(Team $team, ?int $teamReportId): array
    {
        /** @var array<string, mixed> $captured */
        $captured = [];
        View::composer('pdf.wfh-report-admin', function ($view) use (&$captured) {
            $captured = $view->getData();
        });

        $url = "/api/admin/wfh/teams/{$team->id}/pdf";
        if ($teamReportId) {
            $url .= "?team_report_id={$teamReportId}";
        }

        $this->getJson($url)->assertStatus(200);

        return $captured;
    }
}
