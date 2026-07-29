<?php

namespace App\Domains\ChangeManagement\Http\Controllers;

use App\Domains\ChangeManagement\Http\Resources\ChangeTypeResource;
use App\Domains\ChangeManagement\Models\ChangeType;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class ChangeTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ChangeTypeResource::collection(ChangeType::all()),
        ]);
    }
}
