<?php
// Helper untuk mengecilkan gambar (logo/foto) sebelum di-embed ke dompdf.
// Dipanggil dari blade pdf/*. Ditulis sekali, dinamis di kedua view.
if (! function_exists('wfh_pdf_photo_src')) {
    function wfh_pdf_photo_src(?string $path, int $maxW = 480, int $quality = 80): ?string
    {
        if (! $path || ! is_file($path)) {
            return null;
        }
        $info = @getimagesize($path);
        if (! $info) {
            return null;
        }
        [$w, $h, $type] = $info;
        if ($w <= $maxW) {
            return $path; // cukup kecil — dompdf baca file langsung
        }
        if (! function_exists('imagecreatetruecolor') || ! function_exists('imagecopyresampled')) {
            return $path;
        }
        $src = match ($type) {
            IMAGETYPE_JPEG => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($path) : null,
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null,
            default => null,
        };
        if (! $src) {
            return $path;
        }
        $nw = $maxW;
        $nh = (int) round($h * $maxW / $w);
        $dst = imagecreatetruecolor($nw, $nh);
        if ($type === IMAGETYPE_PNG) {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
        }
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        ob_start();
        if ($type === IMAGETYPE_PNG || ! function_exists('imagejpeg')) {
            imagepng($dst, null, 9);
        } else {
            imagejpeg($dst, null, $quality);
        }
        $data = ob_get_clean();
        imagedestroy($src);
        imagedestroy($dst);
        return 'data:image/'.($type === IMAGETYPE_PNG || ! function_exists('imagejpeg') ? 'png' : 'jpeg').';base64,'.base64_encode($data);
    }
}
