<?php

namespace App\Domains\Organization\Http\Controllers;

use App\Domains\Organization\Http\Requests\StoreUserRequest;
use App\Domains\Organization\Http\Requests\UpdateUserRequest;
use App\Domains\Organization\Http\Resources\UserResource;
use App\Domains\Organization\Repositories\UserRepositoryInterface;
use App\Support\Import\UserImport;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private UserRepositoryInterface $userRepository,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('user.manage');

        $users = $this->userRepository->paginateWithRelations(
            perPage: min($request->integer('per_page', 15), 100),
            relations: ['team.field', 'roles'],
        );

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

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('user.manage');

        $data = $request->only(['name', 'nip', 'email', 'team_id', 'rank', 'position', 'phone']);
        $password = Str::random(12);
        $data['password'] = $password;
        $data['is_active'] = true;

        $user = $this->userRepository->create($data);

        $role = Role::where('name', $request->role)->first();
        if ($role) {
            $user->assignRole($role);
        }

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dibuat.',
            'data' => new UserResource($user->load(['team.field', 'roles'])),
            'temp_password' => $password,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $this->authorize('user.manage');

        $user = $this->userRepository->find($id, relations: ['team.field', 'roles']);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $this->authorize('user.manage');

        $user = $this->userRepository->find($id);
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $data = $request->only(['name', 'nip', 'email', 'team_id', 'rank', 'position', 'phone', 'is_active']);
        $this->userRepository->update($id, $data);

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui.',
            'data' => new UserResource($user->fresh(['team.field', 'roles'])),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->authorize('user.manage');

        $deleted = $this->userRepository->delete($id);

        if (! $deleted) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus.',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $this->authorize('user.import');

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $import = new UserImport;

        try {
            Excel::import($import, $request->file('file'));

            // Assign staf role to all imported users that don't have a role yet
            // (handled after import since ToModel doesn't support role assignment)
            return response()->json([
                'success' => true,
                'message' => 'Import selesai.',
                'data' => $import->results,
            ]);
        } catch (\Throwable $e) {
            Log::error('User import failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Import gagal. Silakan periksa format file.',
            ], 422);
        }
    }
}
