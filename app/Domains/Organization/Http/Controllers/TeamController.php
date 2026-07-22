<?php

namespace App\Domains\Organization\Http\Controllers;

use App\Domains\Organization\Http\Resources\UserResource;
use App\Models\Team;
use App\Support\Http\ResolvesFieldScope;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class TeamController extends Controller
{
    use AuthorizesRequests, ResolvesFieldScope;

    public function index(): JsonResponse
    {
        $this->authorize('user.manage');

        $teams = Team::with('field')->orderBy('name')->get()->map(fn ($team) => [
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

        $this->ensureTeamInAdminField($request, $team);

        $perPage = min($request->integer('per_page', 15), 100);
        $users = $team->users()
            ->with(['team.field', 'roles'])
            ->when($request->boolean('active'), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
