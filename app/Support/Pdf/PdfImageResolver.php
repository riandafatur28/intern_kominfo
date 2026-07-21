<?php

namespace App\Support\Pdf;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

/**
 * Resolves attendance photo paths for PDF embedding, handling WebP
 * compatibility with dompdf's GD-based image renderer.
 */
class PdfImageResolver
{
    /**
     * Convert a storage-relative attendance photo path to a PDF-safe file path.
     *
     * WebP images are transcoded to PNG on-the-fly to a temp directory,
     * since dompdf's GD renderer may not support WebP in all environments.
     *
     * Non-WebP images (jpg/png) are resolved to their absolute storage path directly.
     *
     * @param  string|null  $relativePath  e.g. "attendances/1/2026-07-17/abc.webp"
     * @return string|null Absolute file path for dompdf, or null if file doesn't exist
     */
    public static function resolve(?string $relativePath): ?string
    {
        if ($relativePath === null)
        {
            return null;
        }

        $fullPath = Storage::disk('public')->path($relativePath);

        if (! file_exists($fullPath))
        {
            return null;
        }

        // WebP → PNG conversion for dompdf compatibility
        if (str_ends_with(strtolower($fullPath), '.webp'))
        {
            return self::webpToPng($fullPath);
        }

        return $fullPath;
    }

    private static function webpToPng(string $webpPath): string
    {
        $tempDir = storage_path('app/temp/pdf-images');
        if (! is_dir($tempDir))
        {
            mkdir($tempDir, 0755, true);
        }

        $hash = md5($webpPath);
        $pngPath = "{$tempDir}/{$hash}.png";

        // Avoid re-converting in a single request
        if (file_exists($pngPath))
        {
            return $pngPath;
        }

        try
        {
            $image = Image::decode($webpPath);
            $image->save($pngPath);

            return $pngPath;
        }
        catch (\Exception)
        {
            return $webpPath; // fallback — might fail in dompdf, better than blank
        }
    }
}
