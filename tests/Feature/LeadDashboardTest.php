<?php

namespace Tests\Feature;

use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadDashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $lead;
    private Field $field;
    private Field $otherField;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed('RolePermissionSeeder');

        $this->field = Field::create(['name' => 'Bidang A']);
        $this->otherField = Field::create(['name' => 'Bidang B']);

        $team = Team::create(['field_id' => $this->field->id, 'name' => 'Tim A']);

        $this->lead = User::factory()->create([
            'team_id' => $team->id,
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $this->lead->assignRole('kepala_bidang');
        $this->field->update(['head_id' => $this->lead->id]);

        // Seed initiations in lead's field
        ChangeInitiation::factory()->count(3)->create([
            'field_id' => $this->field->id,
            'status' => 'pending',
        ]);
        ChangeInitiation::factory()->count(2)->create([
            'field_id' => $this->field->id,
            'status' => 'approved',
        ]);
        ChangeInitiation::factory()->count(1)->create([
            'field_id' => $this->field->id,
            'status' => 'rejected',
        ]);

        // Seed initiations in other field (should not count)
        ChangeInitiation::factory()->count(5)->create([
            'field_id' => $this->otherField->id,
            'status' => 'pending',
        ]);

        // Ensure permissions are fresh
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        $this->lead->refresh();
    }

    public function test_lead_sees_own_field_initiation_counts(): void
    {
        Sanctum::actingAs($this->lead);

        $response = $this->getJson('/api/changes/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.field.id', $this->field->id)
            ->assertJsonPath('data.pending', 3)
            ->assertJsonPath('data.approved', 2)
            ->assertJsonPath('data.rejected', 1);
    }

    public function test_lead_without_headed_field_returns_null_field(): void
    {
        $leadNoField = User::factory()->create([
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $leadNoField->assignRole('kepala_bidang');
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        Sanctum::actingAs($leadNoField);

        $response = $this->getJson('/api/changes/dashboard');
        $response->assertStatus(200)
            ->assertJsonPath('data.field', null)
            ->assertJsonPath('data.pending', 0);
    }

    public function test_staf_cannot_access_lead_dashboard(): void
    {
        $staf = User::factory()->create([
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $staf->assignRole('staf');
        Sanctum::actingAs($staf);

        $response = $this->getJson('/api/changes/dashboard');
        $response->assertStatus(403);
    }

    public function test_admin_can_access_lead_dashboard(): void
    {
        $admin = User::factory()->create([
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/changes/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_admin_can_filter_by_field_id(): void
    {
        $admin = User::factory()->create([
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/changes/dashboard?field_id=' . $this->field->id);

        $response->assertStatus(200)
            ->assertJsonPath('data.field.id', $this->field->id)
            ->assertJsonPath('data.pending', 3);
    }
}
