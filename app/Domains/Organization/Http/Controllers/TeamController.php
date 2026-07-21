<?php

namespace App\Domains\Organization\Http\Controllers;

use App\Models\Team;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class TeamController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('user.manage');

        $teams = Team::with('field')
            ->when($request->filled('field_id'), fn ($q) => $q->where('field_id', $request->integer('field_id')))
            ->orderBy('name')
            ->get()
            ->map(fn ($team) => [
                'id' => $team->id,
                'name' => $team->name,
                'field' => $team->field ? [
                    'id' => $team->field->id,
                    'name' => $team->field->name,
                ] : null,
            ]);

        return response()->json([
            'success' => true,
            'data' => $teams,
        ]);
    }

    public function users(Request $request, Team $team): JsonResponse
    {
        $this->authorize('user.manage');

        $admin = $request->user();
        $fieldId = $admin->team?->field?->id;

        if (! $fieldId || $team->field_id !== $fieldId) {
            return response()->json([
                'success' => false,
                'message' => 'Tim tidak ditemukan dalam bidang Anda.',
            ], 403);
        }

        $users = $team->users()
            ->when($request->boolean('active'), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get(['id', 'name', 'nip', 'rank', 'position', 'email', 'phone', 'is_active']);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }
}
