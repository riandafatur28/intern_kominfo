<?php

namespace App\Domains\Organization\Http\Controllers;

use App\Domains\Organization\Http\Requests\UpdateRolePermissionsRequest;
use App\Domains\Organization\Http\Resources\RoleResource;
use App\Support\Constants\Roles;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    use AuthorizesRequests;

    public function index(): JsonResponse
    {
        $this->authorize('role.manage');

        $roles = Role::with('permissions')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => RoleResource::collection($roles),
        ]);
    }

    public function updatePermissions(UpdateRolePermissionsRequest $request, int $id): JsonResponse
    {
        $this->authorize('role.manage');

        $role = Role::find($id);

        if (! $role) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak ditemukan.',
            ], 404);
        }

        $permissions = $request->input('permissions', []);

        // Prevent stripping critical permissions from protected roles (lockout prevention)
        if (in_array($role->name, Roles::PROTECTED, true)) {
            $critical = ['role.manage', 'permission.manage', 'user.manage'];
            $missing = array_diff($critical, $permissions);

            if (! empty($missing)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role \''.$role->name.'\' tidak boleh kehilangan permission kritis: '.implode(', ', $missing).'.',
                ], 422);
            }
        }

        $role->syncPermissions($permissions);

        return response()->json([
            'success' => true,
            'message' => 'Permission untuk role berhasil diperbarui.',
            'data' => new RoleResource($role->fresh('permissions')),
        ]);
    }
}
