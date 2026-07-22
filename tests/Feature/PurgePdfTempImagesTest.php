<?php

namespace Tests\Feature;

use App\Console\Commands\PurgePdfTempImages;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class PurgePdfTempImagesTest extends TestCase
{
    use RefreshDatabase;

    private string $tempDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = storage_path('app/temp/pdf-images');
        if (is_dir($this->tempDir)) {
            File::cleanDirectory($this->tempDir);
        }
    }

    public function test_purges_files_older_than_one_day(): void
    {
        if (! is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }

        $staleFile = "{$this->tempDir}/stale.png";
        $freshFile = "{$this->tempDir}/fresh.png";

        File::put($staleFile, 'old');
        File::put($freshFile, 'new');

        // Backdate stale file by 2 days
        touch($staleFile, now()->subDays(2)->getTimestamp());

        $this->artisan(PurgePdfTempImages::class)
            ->assertSuccessful();

        $this->assertFalse(file_exists($staleFile), 'stale file should be purged');
        $this->assertTrue(file_exists($freshFile), 'fresh file should remain');
    }

    public function test_succeeds_when_directory_missing(): void
    {
        // Ensure directory doesn't exist
        if (is_dir($this->tempDir)) {
            File::deleteDirectory($this->tempDir);
        }

        $this->artisan(PurgePdfTempImages::class)
            ->assertSuccessful();
    }
}
