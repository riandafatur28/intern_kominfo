<?php

namespace App\Http\Controllers;

use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Domains\Wfh\Models\WfhReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class QrVerificationController extends Controller
{
    public function verify(string $token): JsonResponse
    {
        // Validate token format: 64-char lowercase hex string
        if (! preg_match('/^[a-f0-9]{64}$/', $token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token verifikasi tidak valid.',
            ], 404);
        }

        $report = WfhReport::where('verification_token', $token)->first();

        if ($report) {
            return response()->json([
                'success' => true,
                'data' => [
                    'doc_type' => 'WFH Report',
                    'doc_number' => 'WFH-'.$report->id,
                    'report_date' => $report->report_date->format('Y-m-d'),
                    'status' => 'terverifikasi',
                    'message' => 'Dokumen telah ditandatangani secara elektronik.',
                ],
            ]);
        }

        $initiation = ChangeInitiation::where('verification_token', $token)->first();

        if ($initiation) {
            return response()->json([
                'success' => true,
                'data' => [
                    'doc_type' => 'Change Initiation',
                    'doc_number' => $initiation->doc_number,
                    'status' => 'terverifikasi',
                    'message' => 'Dokumen telah ditandatangani secara elektronik.',
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Token verifikasi tidak ditemukan.',
        ], 404);
    }
}
