<?php

namespace Tests\Unit;

use App\Support\Wfh\AttendancePhotoServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttendancePhotoServiceTest extends TestCase
{
    private AttendancePhotoServiceInterface $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->service = $this->app->make(AttendancePhotoServiceInterface::class);
    }

    public function test_stores_uploaded_jpg_as_webp(): void
    {
        $photo = UploadedFile::fake()->image('bukti.jpg', 100, 100);
        $path = $this->service->store($photo, 1, '2026-07-17');

        $this->assertStringEndsWith('.webp', $path);
        $this->assertStringStartsWith('attendances/1/2026-07-17/', $path);

        Storage::disk('public')->assertExists($path);
    }

    public function test_stores_png_as_webp(): void
    {
        $photo = UploadedFile::fake()->image('bukti.png', 100, 100);
        $path = $this->service->store($photo, 2, '2026-07-17');

        $this->assertStringEndsWith('.webp', $path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_output_is_smaller_than_input(): void
    {
        // A large fake image (intervention creates a JPEG of ~few KB for 800x600)
        $photo = UploadedFile::fake()->image('large.jpg', 800, 600);
        $originalSize = $photo->getSize();

        $path = $this->service->store($photo, 3, '2026-07-17');
        $webpSize = Storage::disk('public')->size($path);

        // WebP at quality 80 produces a consistently smaller file than the
        // source JPEG for these synthetic images (empirically ~10% of original).
        $this->assertLessThanOrEqual($originalSize, $webpSize,
            "WebP output ({$webpSize}B) should be <= original JPEG ({$originalSize}B)");
    }

    public function test_resizes_large_image_to_max_dimension(): void
    {
        // A 4000x3000 image (width > height)
        $photo = UploadedFile::fake()->image('huge.jpg', 4000, 3000);

        $path = $this->service->store($photo, 4, '2026-07-17');

        $fullPath = Storage::disk('public')->path($path);
        [$width, $height] = getimagesize($fullPath);

        $maxDimension = config('images.attendance_photo_max_dimension', 1280);
        $this->assertLessThanOrEqual($maxDimension, max($width, $height));
    }

    public function test_resizes_portrait_orientation(): void
    {
        $photo = UploadedFile::fake()->image('tall.jpg', 600, 3000);

        $path = $this->service->store($photo, 5, '2026-07-17');

        $fullPath = Storage::disk('public')->path($path);
        [$width, $height] = getimagesize($fullPath);

        // Height = 3000 is the longer edge, should be resized
        $this->assertLessThan(2000, max($width, $height));
    }
}
