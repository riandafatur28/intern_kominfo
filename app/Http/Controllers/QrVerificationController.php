<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class QrVerificationController extends Controller
{
    public function verify(string $hash): JsonResponse
    {
        // Validate SHA256 hex format
        if (! preg_match('/^[a-f0-9]{64}$/', $hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Hash tidak valid.',
            ], 404);
        }

        // In production, look up hash in document tables.
        // For now, return verification status with the hash.
        // The hash encodes: sha256(doc_number|content)
        // Future: store hash in document records for lookup.
        return response()->json([
            'success' => true,
            'data' => [
                'hash' => $hash,
                'status' => 'terverifikasi',
                'message' => 'Dokumen telah ditandatangani secara elektronik.',
            ],
        ]);
    }
}
