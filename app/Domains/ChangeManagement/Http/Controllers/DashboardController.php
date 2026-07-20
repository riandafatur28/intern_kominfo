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

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $fieldId = $request->input('field_id');
        $field = null;

        if ($fieldId) {
            $field = Field::find($fieldId);
        } elseif ($user->hasRole('admin')) {
            // Admin without field_id sees all
        } elseif ($user->hasRole('kepala_bidang')) {
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
            $fieldId = $field->id;
        } else {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $counts = $this->repo->countInitiationsByStatus($fieldId);

        return response()->json([
            'success' => true,
            'data' => [
                'field' => $field ? ['id' => $field->id, 'name' => $field->name] : null,
                'pending' => $counts['pending'],
                'approved' => $counts['approved'],
                'rejected' => $counts['rejected'],
            ],
        ]);
    }
}
