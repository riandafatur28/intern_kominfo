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
}
