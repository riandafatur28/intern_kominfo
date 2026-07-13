<?php

namespace App\Support\QrCode;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class QrCodeService
{
    /**
     * Generate a QR code as inline SVG string (no GD dependency).
     *
     * @param  string  $data  Data to encode
     * @param  int  $size  QR code pixel size
     * @return string Inline SVG HTML
     */
    public function generate(string $data, int $size = 120): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size, margin: 0),
            new SvgImageBackEnd,
        );

        return (new Writer($renderer))->writeString($data);
    }

    /**
     * Generate a verification payload for document integrity.
     *
     * @param  string  $docNumber  Document identifier
     * @param  string  $content  Document content hash
     * @return string Verification URL
     */
    public function generateVerificationUrl(string $docNumber, string $content): string
    {
        $hash = hash('sha256', $docNumber.'|'.$content);

        return config('app.url')."/api/verify/{$hash}";
    }
}
