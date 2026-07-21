<?php

namespace Tests\Unit;

use App\Support\Pdf\PdfImageResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PdfImageResolverTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_returns_null_for_null_path(): void
    {
        $this->assertNull(PdfImageResolver::resolve(null));
    }

    public function test_returns_null_for_missing_file(): void
    {
        $this->assertNull(PdfImageResolver::resolve('nonexistent.webp'));
    }

    public function test_returns_absolute_path_for_non_webp(): void
    {
        $photo = UploadedFile::fake()->image('photo.jpg', 100, 100);
        $path = $photo->store('test', 'public');

        $resolved = PdfImageResolver::resolve($path);

        $this->assertNotNull($resolved);
        $this->assertFileExists($resolved);
    }

    public function test_webp_converted_to_png_in_temp_dir(): void
    {
        // Create a real webp via the attendance photo service
        $photo = UploadedFile::fake()->image('photo.jpg', 100, 100);
        $service = $this->app->make(\App\Support\Wfh\AttendancePhotoServiceInterface::class);
        $webpPath = $service->store($photo, 1, '2026-07-17');

        $resolved = PdfImageResolver::resolve($webpPath);

        $this->assertNotNull($resolved);
        $this->assertFileExists($resolved);
        $this->assertStringEndsWith('.png', $resolved);
        $this->assertStringContainsString('temp/pdf-images', $resolved);
    }

    public function test_cache_invalidates_when_webp_content_changes(): void
    {
        $photo1 = UploadedFile::fake()->image('v1.jpg', 200, 200);
        $service = $this->app->make(\App\Support\Wfh\AttendancePhotoServiceInterface::class);
        $webpPath = $service->store($photo1, 1, '2026-07-17');

        $firstResolved = PdfImageResolver::resolve($webpPath);

        // Overwrite the webp with different content + bump mtime
        $photo2 = UploadedFile::fake()->image('v2.jpg', 400, 400);
        $encoded = \Intervention\Image\Laravel\Facades\Image::decode($photo2->getRealPath())
            ->encode(new \Intervention\Image\Encoders\WebpEncoder(80));
        Storage::disk('public')->put($webpPath, $encoded);
        // Bump mtime forward so cache key changes
        $abs = Storage::disk('public')->path($webpPath);
        touch($abs, now()->addSecond()->getTimestamp());

        $secondResolved = PdfImageResolver::resolve($webpPath);

        $this->assertNotEquals($firstResolved, $secondResolved,
            'Cache key must include mtime so content changes invalidate the cached PNG.');
    }
}
