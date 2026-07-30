<?php

namespace App\Support\Signature;

interface SignatureServiceInterface
{
    /**
     * Normalize an uploaded signature image: trim whitespace,
     * apply alpha threshold to reduce noise, resize to template dimensions.
     *
     * @param  string  $sourcePath  Temporary upload path
     * @param  int  $userId  User ID for output filename
     * @return string Relative storage path (e.g. 'signatures/1.png')
     */
    public function normalize(string $sourcePath, int $userId): string;
}
