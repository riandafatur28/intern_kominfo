<?php

namespace App\Domains\ChangeManagement\Http\Controllers;

use App\Domains\ChangeManagement\Repositories\ChangeManagementRepositoryInterface;
use App\Models\Field;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DashboardController extends Controller
{
    public function __construct(
        private ChangeManagementRepositoryInterface $repo,
    ) {}

    /**
     * Initiation status counts for the lead dashboard.
     *
     * Scope resolution:
     * - kepala_bidang: their headed field (first one); ?field_id is ignored.
     *   No headed field → 200 with field:null and zero counts.
     * - admin: ?field_id is required and must exist. The plan invariant is
     *   "admin tetap scoped ke 1 field per request" — no org-wide totals.
     *
     * Authorization is enforced by the route middleware (role:kepala_bidang|admin);
     * the action assumes one of those roles.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasRole('admin')) {
            $fieldId = $request->input('field_id');
            if (! $fieldId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter field_id wajib diisi.',
                ], 422);
            }
            $field = Field::find($fieldId);
            if (! $field) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bidang tidak ditemukan.',
                ], 404);
            }
        } else {
            // kepala_bidang — scope to their headed field, ignore any field_id.
            $field = $user->headedFields()->first();
            if (! $field) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'field' => null,
                        'pending' => 0,
                        'approved' => 0,
                        'rejected' => 0,
                    ],
                ]);
            }
        }

        $counts = $this->repo->countInitiationsByStatus($field->id);

        return response()->json([
            'success' => true,
            'data' => [
                'field' => ['id' => $field->id, 'name' => $field->name],
                'pending' => $counts['pending'],
                'approved' => $counts['approved'],
                'rejected' => $counts['rejected'],
            ],
        ]);
    }
}
