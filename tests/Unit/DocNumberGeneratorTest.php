<?php

namespace Tests\Unit;

use App\Domains\ChangeManagement\Services\DocNumberGenerator;
use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Models\User;
use App\Models\Field;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocNumberGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private DocNumberGenerator $generator;
    private User $user;
    private Field $field;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = app(DocNumberGenerator::class);
        $this->user = User::factory()->create();
        $this->field = Field::factory()->create();
    }

    public function test_generates_first_sequence_for_year(): void
    {
        $docNumber = $this->generator->generate();

        $this->assertStringContainsString(date('Y'), $docNumber);
        $this->assertStringContainsString('001', $docNumber);
    }

    public function test_increments_sequence_with_existing_initiations(): void
    {
        ChangeInitiation::factory()->count(2)->create([
            'field_id' => $this->field->id,
            'initiator_id' => $this->user->id,
        ]);

        $docNumber = $this->generator->generate();

        $this->assertStringContainsString('003', $docNumber);
    }

    public function test_resets_sequence_per_year(): void
    {
        // Create initiation from last year
        ChangeInitiation::factory()->create([
            'field_id' => $this->field->id,
            'initiator_id' => $this->user->id,
            'created_at' => now()->subYear(),
        ]);

        $docNumber = $this->generator->generate();

        $this->assertStringContainsString('001', $docNumber);
    }

    public function test_format_follows_expected_pattern(): void
    {
        $docNumber = $this->generator->generate();

        $this->assertMatchesRegularExpression(
            '/^\d{3}\/9\/1\.1\/114\/\d{4}$/',
            $docNumber
        );
    }
}
