<?php

namespace Database\Seeders\Concerns;

use App\Models\User;

/**
 * Fills `position` and `signature_path` for seeded demo/admin accounts so generated
 * PDFs (change-management, WFH) render a real job title and a visible signature
 * instead of blank "-" fields, matching the reference document layout.
 *
 * The signature is a deterministic placeholder doodle (not a real handwritten
 * signature) — good enough to prove the PDF's signature block renders correctly
 * end to end for local dev/demo. Swap in a real uploaded signature via the profile
 * page for anything user-facing.
 */
trait SeedsPlaceholderSignature
{
    private function applyPlaceholderIdentity(User $user, string $position): void
    {
        $relativePath = "signatures/{$user->id}.png";
        $fullPath = storage_path("app/public/{$relativePath}");

        if (! is_file($fullPath)) {
            @mkdir(dirname($fullPath), 0775, true);
            $this->drawPlaceholderSignature($fullPath, $user->name);
        }

        $user->update([
            'position' => $position,
            'signature_path' => $relativePath,
        ]);
    }

    private function drawPlaceholderSignature(string $destination, string $seedName): void
    {
        // Kept close to a 2:1 aspect ratio — the PDF signature box scales the image to a
        // fixed height (55px) with width:auto, so a wide canvas (a real trimmed upload's
        // ImageSignatureService caps at 300x100, i.e. 3:1, but only *after* cropping tight
        // to ink) would overflow the ~130px-wide box. This canvas has no whitespace to
        // trim, so it must already be narrow enough on its own.
        $width = 170;
        $height = 90;

        $image = imagecreatetruecolor($width, $height);
        imagesavealpha($image, true);
        $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
        imagefill($image, 0, 0, $transparent);

        $ink = imagecolorallocate($image, 25, 25, 40);
        imagesetthickness($image, 3);
        imageantialias($image, true);

        // Deterministic pseudo-random squiggle seeded by name, so each demo user
        // gets a distinct-looking (but reproducible) placeholder scribble.
        mt_srand(crc32($seedName));
        $x = 10;
        $y = 45;
        $prevX = $x;
        $prevY = $y;
        for ($i = 0; $i < 6; $i++) {
            $x += mt_rand(14, 22);
            $y = 40 + mt_rand(-20, 20);
            imageline($image, $prevX, $prevY, $x, $y, $ink);
            $prevX = $x;
            $prevY = $y;
        }
        // Underline flourish, like a signature dash.
        imageline($image, 8, 70, $width - 8, 70, $ink);

        imagepng($image, $destination);
        imagedestroy($image);
    }
}
