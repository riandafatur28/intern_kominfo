<?php

namespace Tests\Unit;

use App\Domains\Wfh\Services\WfhReportStateMachine;
use App\Domains\Wfh\Models\WfhReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WfhReportStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private WfhReportStateMachine $machine;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->machine = app(WfhReportStateMachine::class);
        $this->user = User::factory()->create();
    }

    public function test_can_submit_draft_report(): void
    {
        $report = WfhReport::factory()->create([
            'status' => 'draft',
            'user_id' => $this->user->id,
        ]);

        $result = $this->machine->submit($report, $this->user);

        $this->assertEquals('pending', $result->status);
        $this->assertNotNull($result->maker_signed_at);
    }

    public function test_cannot_submit_non_draft_report(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Hanya laporan dengan status draft yang dapat disubmit.');

        $report = WfhReport::factory()->create([
            'status' => 'pending',
            'user_id' => $this->user->id,
        ]);

        $this->machine->submit($report, $this->user);
    }

    public function test_cannot_submit_approved_report(): void
    {
        $this->expectException(\DomainException::class);

        $report = WfhReport::factory()->create([
            'status' => 'approved',
            'user_id' => $this->user->id,
        ]);

        $this->machine->submit($report, $this->user);
    }

    public function test_can_approve_pending_report(): void
    {
        $report = WfhReport::factory()->create([
            'status' => 'pending',
            'user_id' => $this->user->id,
        ]);

        $result = $this->machine->approve($report, $this->user);

        $this->assertEquals('approved', $result->status);
        $this->assertNotNull($result->supervisor_signed_at);
        $this->assertEquals($this->user->id, $result->supervisor_id);
    }

    public function test_cannot_approve_non_pending_report(): void
    {
        $this->expectException(\DomainException::class);

        $report = WfhReport::factory()->create([
            'status' => 'draft',
            'user_id' => $this->user->id,
        ]);

        $this->machine->approve($report, $this->user);
    }

    public function test_can_reject_pending_report(): void
    {
        $report = WfhReport::factory()->create([
            'status' => 'pending',
            'user_id' => $this->user->id,
        ]);

        $result = $this->machine->reject($report, $this->user, 'Dokumen kurang lengkap');

        $this->assertEquals('rejected', $result->status);
        $this->assertEquals('Dokumen kurang lengkap', $result->reject_reason);
    }

    public function test_can_revise_rejected_report(): void
    {
        $supervisor = User::factory()->create(['name' => 'Supervisor']);

        $report = WfhReport::factory()->create([
            'status' => 'rejected',
            'user_id' => $this->user->id,
            'maker_signed_at' => now()->subDay(),
            'supervisor_id' => $supervisor->id,
            'reject_reason' => 'Revisi',
        ]);

        $result = $this->machine->revise($report);

        $this->assertEquals('draft', $result->status);
        $this->assertNull($result->maker_signed_at);
        $this->assertNull($result->reject_reason);
    }

    public function test_cannot_revise_non_rejected_report(): void
    {
        $this->expectException(\DomainException::class);

        $report = WfhReport::factory()->create([
            'status' => 'approved',
            'user_id' => $this->user->id,
        ]);

        $this->machine->revise($report);
    }

    public function test_can_edit_only_draft_or_rejected(): void
    {
        $draft = WfhReport::factory()->create(['status' => 'draft', 'user_id' => $this->user->id]);
        $rejected = WfhReport::factory()->create(['status' => 'rejected', 'user_id' => $this->user->id]);
        $pending = WfhReport::factory()->create(['status' => 'pending', 'user_id' => $this->user->id]);
        $approved = WfhReport::factory()->create(['status' => 'approved', 'user_id' => $this->user->id]);

        $this->assertTrue($this->machine->canEdit($draft));
        $this->assertTrue($this->machine->canEdit($rejected));
        $this->assertFalse($this->machine->canEdit($pending));
        $this->assertFalse($this->machine->canEdit($approved));
    }

    public function test_approved_is_immutable(): void
    {
        $approved = WfhReport::factory()->create(['status' => 'approved', 'user_id' => $this->user->id]);
        $draft = WfhReport::factory()->create(['status' => 'draft', 'user_id' => $this->user->id]);

        $this->assertTrue($this->machine->isImmutable($approved));
        $this->assertFalse($this->machine->isImmutable($draft));
    }
}
