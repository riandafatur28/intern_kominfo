<?php

namespace App\Support\Wfh;

use Illuminate\Http\UploadedFile;

interface AttendancePhotoServiceInterface
{
    /**
     * Store an attendance photo as WebP on the public disk.
     *
     * @param  UploadedFile  $source  Uploaded image (jpg/png)
     * @param  int  $userId
     * @param  string  $date  Y-m-d
     * @return string Relative storage path (e.g. 'attendances/1/2026-07-17/abc123.webp')
     */
    public function store(UploadedFile $source, int $userId, string $date): string;
}
