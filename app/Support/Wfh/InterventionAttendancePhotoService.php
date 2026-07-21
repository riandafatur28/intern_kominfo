<?php

namespace App\Support\Wfh;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\Laravel\Facades\Image;

class InterventionAttendancePhotoService implements AttendancePhotoServiceInterface
{
    public function store(UploadedFile $source, int $userId, string $date): string
    {
        $image = Image::decode($source->getRealPath());

        $maxDimension = config('wfh.attendance_photo_max_dimension', 1280);
        $quality = config('wfh.attendance_photo_quality', 80);

        if (max($image->width(), $image->height()) > $maxDimension) {
            $image->scaleDown(width: $maxDimension, height: $maxDimension);
        }

        $encoded = $image->encode(new WebpEncoder($quality));

        $filename = Str::random(32).'.webp';
        $relativePath = "attendances/{$userId}/{$date}/{$filename}";

        Storage::disk('public')->put($relativePath, $encoded);

        return $relativePath;
    }
}
