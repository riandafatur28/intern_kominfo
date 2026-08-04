<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileSignatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_user_can_upload_signature(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/profile/signature', [
            'signature' => UploadedFile::fake()->image('sig.png', 300, 100),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.signature_path', "signatures/{$user->id}.png");

        Storage::disk('public')->assertExists("signatures/{$user->id}.png");
        $this->assertSame("signatures/{$user->id}.png", $user->fresh()->signature_path);
    }

    public function test_user_can_delete_signature(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/profile/signature', [
            'signature' => UploadedFile::fake()->image('sig.png', 300, 100),
        ])->assertStatus(200);

        Storage::disk('public')->assertExists("signatures/{$user->id}.png");

        $response = $this->deleteJson('/api/profile/signature');

        $response->assertStatus(200)
            ->assertJsonPath('data.signature_path', null)
            ->assertJsonPath('data.signature_url', null);

        Storage::disk('public')->assertMissing("signatures/{$user->id}.png");
        $this->assertNull($user->fresh()->signature_path);
    }

    public function test_deleting_signature_when_none_exists_is_a_no_op(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->deleteJson('/api/profile/signature');

        $response->assertStatus(200)
            ->assertJsonPath('data.signature_path', null);

        $this->assertNull($user->fresh()->signature_path);
    }
}
