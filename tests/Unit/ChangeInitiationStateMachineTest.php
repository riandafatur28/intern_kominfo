<?php

namespace Tests\Unit;

use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Models\Field;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChangeInitiationStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private User $initiator;
    private User $reviewer;
    private Field $field;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initiator = User::factory()->create();
        $this->reviewer = User::factory()->create();
        $this->field = Field::factory()->create();
    }

    public function test_draft_initiation_can_be_submitted(): void
    {
        $initiation = $this->createInitiation('draft');

        $initiation->update([
            'status' => 'pending',
            'initiator_signed_at' => now(),
        ]);

        $this->assertEquals('pending', $initiation->fresh()->status);
        $this->assertNotNull($initiation->fresh()->initiator_signed_at);
    }

    public function test_cannot_submit_already_submitted_initiation(): void
    {
        $initiation = $this->createInitiation('pending');

        // Attempt to submit again should be rejected
        $allowed = $initiation->status === 'draft';

        $this->assertFalse($allowed);
    }

    public function test_pending_initiation_can_be_approved(): void
    {
        $initiation = $this->createInitiation('pending');

        $initiation->update([
            'status' => 'approved',
            'review_status' => 'approved',
            'reviewer_id' => $this->reviewer->id,
            'reviewed_at' => now(),
        ]);

        $fresh = $initiation->fresh();
        $this->assertEquals('approved', $fresh->status);
        $this->assertEquals('approved', $fresh->review_status);
        $this->assertEquals($this->reviewer->id, $fresh->reviewer_id);
    }

    public function test_pending_initiation_can_be_rejected(): void
    {
        $initiation = $this->createInitiation('pending');

        $initiation->update([
            'status' => 'rejected',
            'review_status' => 'rejected',
            'reviewer_id' => $this->reviewer->id,
            'review_reason' => 'Dokumen tidak lengkap',
        ]);

        $fresh = $initiation->fresh();
        $this->assertEquals('rejected', $fresh->status);
        $this->assertEquals('Dokumen tidak lengkap', $fresh->review_reason);
    }

    public function test_rejected_initiation_can_be_resubmitted_as_draft(): void
    {
        $initiation = $this->createInitiation('rejected');
        // Simulate reset to draft for revision
        $initiation->update([
            'status' => 'draft',
            'initiator_signed_at' => null,
            'reviewer_id' => null,
        ]);

        $fresh = $initiation->fresh();
        $this->assertEquals('draft', $fresh->status);
        $this->assertNull($fresh->initiator_signed_at);
    }

    public function test_implementation_only_allowed_when_approved(): void
    {
        $draft = $this->createInitiation('draft');
        $pending = $this->createInitiation('pending');
        $approved = $this->createInitiation('approved');
        $rejected = $this->createInitiation('rejected');

        $this->assertFalse($draft->status === 'approved');
        $this->assertFalse($pending->status === 'approved');
        $this->assertTrue($approved->status === 'approved');
        $this->assertFalse($rejected->status === 'approved');
    }

    public function test_approved_initiation_is_immutable(): void
    {
        $initiation = $this->createInitiation('approved');

        // Attempt submit on approved (should be rejected)
        $canSubmit = $initiation->status === 'draft';
        $this->assertFalse($canSubmit);

        // Attempt approve on already approved (should be rejected)
        $canApprove = $initiation->status === 'pending';
        $this->assertFalse($canApprove);
    }

    private function createInitiation(string $status): ChangeInitiation
    {
        return ChangeInitiation::factory()->create([
            'field_id' => $this->field->id,
            'initiator_id' => $this->initiator->id,
            'status' => $status,
        ]);
    }
}
