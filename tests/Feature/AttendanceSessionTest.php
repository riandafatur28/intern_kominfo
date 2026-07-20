<?php

namespace Tests\Feature;

use App\Models\Team;
use App\Models\User;
use App\Support\Constants\WfhSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression guard for the "siang" session bug: CheckInRequest used to reject
 * any session outside {pagi, sore}, even though the rest of the stack
 * (monitoring board, cron, notifications) already honored 3 sessions.
 * These tests pin the contract that WfhSession::ALL is the source of truth.
 */
class AttendanceSessionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        Storage::fake('public');
        // Allow any ISO day so the test is not gated on Friday.
        config(['wfh.allowed_days' => [1, 2, 3, 4, 5, 6, 7]]);
    }

    public function test_accepts_siang_session(): void
    {
        Sanctum::actingAs($this->staf());

        $this->postJson('/api/wfh/attendance', [
            'photo' => UploadedFile::fake()->image('bukti.jpg'),
            'session' => WfhSession::SIANG,
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.session', WfhSession::SIANG);
    }

    public function test_rejects_unknown_session(): void
    {
        Sanctum::actingAs($this->staf());

        $this->postJson('/api/wfh/attendance', [
            'photo' => UploadedFile::fake()->image('bukti.jpg'),
            'session' => 'malam',
        ])->assertStatus(422);
    }

    public function test_defaults_to_pagi_when_session_omitted(): void
    {
        Sanctum::actingAs($this->staf());

        $this->postJson('/api/wfh/attendance', [
            'photo' => UploadedFile::fake()->image('bukti.jpg'),
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.session', WfhSession::PAGI);
    }

    public function test_accepts_every_canonical_session(): void
    {
        foreach (WfhSession::ALL as $session) {
            $user = $this->staf();
            Sanctum::actingAs($user);

            $this->postJson('/api/wfh/attendance', [
                'photo' => UploadedFile::fake()->image('bukti.jpg'),
                'session' => $session,
            ])
                ->assertStatus(201)
                ->assertJsonPath('data.session', $session);
        }
    }

    private function staf(): User
    {
        $team = Team::factory()->create();
        $user = User::factory()->create([
            'team_id' => $team->id,
            'must_change_password' => false,
        ]);
        $user->assignRole('staf');

        return $user;
    }
}
