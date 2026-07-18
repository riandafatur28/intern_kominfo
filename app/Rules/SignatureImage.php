<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Intervention\Image\Laravel\Facades\Image;

class SignatureImage implements ValidationRule
{
    /**
     * Minimum ratio of light (background) pixels.
     * Signature on white paper → most pixels are white.
     */
    private const MIN_LIGHT_RATIO = 0.4;

    /**
     * Min/max ratio of dark (ink) pixels.
     * Too few = blank, too many = filled/solid image.
     */
    private const MIN_DARK_RATIO = 0.005;

    private const MAX_DARK_RATIO = 0.55;

    /**
     * Min aspect ratio (width/height). Signatures typically wider than tall.
     */
    private const MIN_ASPECT_RATIO = 0.4;

    private const MAX_ASPECT_RATIO = 12.0;

    /** Brightness threshold for "light" pixel (white bg). */
    private const LIGHT_THRESHOLD = 220;

    /** Brightness threshold for "dark" pixel (ink stroke). */
    private const DARK_THRESHOLD = 100;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Must be an uploaded file
        if (! ($value instanceof UploadedFile)) {
            $fail('Bukan file upload yang valid.');

            return;
        }

        try {
            $image = Image::decode($value->getRealPath());
        } catch (\Throwable $e) {
            $fail('Gambar tidak dapat diproses. Pastikan file gambar valid.');

            return;
        }

        $gd = $image->core()->native();

        $width = imagesx($gd);
        $height = imagesy($gd);

        if ($width === 0 || $height === 0) {
            $fail('Dimensi gambar tidak valid.');

            return;
        }

        // 1. Aspect ratio check
        $aspect = $width / $height;
        if ($aspect < self::MIN_ASPECT_RATIO || $aspect > self::MAX_ASPECT_RATIO) {
            $fail('Rasio dimensi gambar tidak sesuai untuk tanda tangan.');

            return;
        }

        // 2. Pixel analysis — sample evenly across image (skip some pixels for speed)
        $totalPixels = 0;
        $lightPixels = 0;
        $darkPixels = 0;

        $stepX = max(1, intdiv($width, 100));
        $stepY = max(1, intdiv($height, 100));

        for ($y = 0; $y < $height; $y += $stepY) {
            for ($x = 0; $x < $width; $x += $stepX) {
                $rgb = imagecolorat($gd, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                $brightness = ($r + $g + $b) / 3;
                $totalPixels++;

                if ($brightness >= self::LIGHT_THRESHOLD) {
                    $lightPixels++;
                }
                if ($brightness <= self::DARK_THRESHOLD) {
                    $darkPixels++;
                }
            }
        }

        if ($totalPixels === 0) {
            $fail('Gambar terlalu kecil untuk dianalisis.');

            return;
        }

        $lightRatio = $lightPixels / $totalPixels;
        $darkRatio = $darkPixels / $totalPixels;

        // 3. Must have enough white background
        if ($lightRatio < self::MIN_LIGHT_RATIO) {
            $fail('Latar belakang gambar harus didominasi warna putih/terang. Gunakan gambar tanda tangan di atas kertas putih.');

            return;
        }

        // 4. Must have enough ink strokes (dark pixels)
        if ($darkRatio < self::MIN_DARK_RATIO) {
            $fail('Gambar tidak mengandung coretan tanda tangan. Pastikan tanda tangan terlihat jelas.');

            return;
        }

        // 5. Not too much ink (rejects solid dark images, photos)
        if ($darkRatio > self::MAX_DARK_RATIO) {
            $fail('Gambar terlalu padat. Tanda tangan harus berupa coretan di atas latar putih.');

            return;
        }
    }
}
