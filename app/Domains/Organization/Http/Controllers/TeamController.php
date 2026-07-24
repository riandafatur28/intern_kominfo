<?php

namespace App\Domains\Organization\Http\Controllers;

use App\Domains\Organization\Http\Resources\TeamResource;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class TeamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Team::query();

        if ($request->filled('field_id')) {
            $query->where('field_id', $request->integer('field_id'));
        }

        $teams = $query->get(['id', 'name', 'leader_id', 'field_id']);

        return response()->json([
            'success' => true,
            'data' => TeamResource::collection($teams),
        ]);
    }
}