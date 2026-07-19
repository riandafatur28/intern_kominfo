<?php

namespace App\Domains\ChangeManagement\Repositories;

use App\Domains\ChangeManagement\Models\ChangeImplementation;
use App\Domains\ChangeManagement\Models\ChangeImplementationAttachment;
use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Repositories\EloquentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentChangeManagementRepository extends EloquentRepository implements ChangeManagementRepositoryInterface
{
    public function __construct(ChangeInitiation $model)
    {
        parent::__construct($model);
    }

    public function paginateInitiations(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = ChangeInitiation::with(['field', 'initiator', 'reviewer', 'implementations']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['field_id'])) {
            $query->where('field_id', $filters['field_id']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('doc_number', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function findInitiationWithRelations(int $id): ?ChangeInitiation
    {
        return ChangeInitiation::with([
            'field', 'initiator.team', 'reviewer',
            'implementations.evaluator', 'implementations.reviewer', 'implementations.responsible',
            'implementations.changeTypes', 'implementations.attachments',
        ])->find($id);
    }

    public function createInitiation(array $data): ChangeInitiation
    {
        return ChangeInitiation::create($data);
    }

    public function findImplementationWithRelations(int $id): ?ChangeImplementation
    {
        return ChangeImplementation::with([
            'initiation.field', 'initiation.initiator',
            'evaluator', 'reviewer', 'responsible',
            'changeTypes', 'attachments',
        ])->find($id);
    }

    public function createImplementation(int $initiationId, array $data, array $typeIds): ChangeImplementation
    {
        return DB::transaction(function () use ($initiationId, $data, $typeIds) {
            $impl = ChangeImplementation::create(array_merge($data, [
                'change_initiation_id' => $initiationId,
            ]));

            if (! empty($typeIds)) {
                $impl->changeTypes()->sync($typeIds);
            }

            return $impl->fresh(['changeTypes']);
        });
    }

    public function updateImplementation(int $id, array $data, array $typeIds): bool
    {
        return DB::transaction(function () use ($id, $data, $typeIds) {
            $impl = ChangeImplementation::find($id);
            if (! $impl) {
                return false;
            }

            $impl->update($data);
            $impl->changeTypes()->sync($typeIds);

            return true;
        });
    }

    public function addAttachments(int $implementationId, array $paths): void
    {
        DB::transaction(function () use ($implementationId, $paths) {
            $sortOrder = ChangeImplementationAttachment::where('change_implementation_id', $implementationId)->count();

            foreach ($paths as $path) {
                ChangeImplementationAttachment::create([
                    'change_implementation_id' => $implementationId,
                    'path' => $path,
                    'sort_order' => $sortOrder++,
                ]);
            }
        });
    }

    public function submitImplementation(int $id, int $evaluatorId): void
    {
        ChangeImplementation::where('id', $id)->update([
            'status' => 'submitted',
            'evaluator_signed_at' => now(),
        ]);
    }

    public function reviewImplementation(int $id, array $data): void
    {
        ChangeImplementation::where('id', $id)->update($data);
    }
}
