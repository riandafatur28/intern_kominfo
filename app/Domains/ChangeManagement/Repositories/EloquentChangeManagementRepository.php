<?php

namespace App\Domains\ChangeManagement\Repositories;

use App\Domains\ChangeManagement\Models\ChangeImplementation;
use App\Domains\ChangeManagement\Models\ChangeImplementationAttachment;
use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Models\User;
use App\Repositories\EloquentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EloquentChangeManagementRepository extends EloquentRepository implements ChangeManagementRepositoryInterface
{
    /** @var array<string, string> */
    private const CHILD_STATUS_MIRROR = [
        'draft' => 'draft',
        'pending' => 'submitted',
        'approved' => 'completed',
        'rejected' => 'rejected',
    ];

    /** Relations loaded for a full package read (show / after-write return). */
    private const PACKAGE_RELATIONS = [
        'field',
        'initiator.team',
        'reviewer',
        'implementation.evaluator',
        'implementation.reviewer',
        'implementation.responsible',
        'implementation.changeTypes',
        'implementation.attachments',
    ];

    /** Relations loaded for a list row (summary, no attachment rows). */
    private const PACKAGE_LIST_RELATIONS = [
        'field',
        'initiator.team',
        'reviewer',
        'implementation.changeTypes',
    ];

    public function __construct(ChangeInitiation $model)
    {
        parent::__construct($model);
    }

    public function createPackage(array $initiation, array $implementation, array $typeIds): ChangeInitiation
    {
        return DB::transaction(function () use ($initiation, $implementation, $typeIds) {
            $parent = ChangeInitiation::create(array_merge([
                'status' => 'draft',
            ], $initiation));

            $impl = ChangeImplementation::create(array_merge([
                'status' => 'draft',
                'priority' => 'medium',
                'impact' => 'low',
            ], $implementation, [
                'change_initiation_id' => $parent->id,
            ]));

            if (! empty($typeIds)) {
                $impl->changeTypes()->sync($typeIds);
            }

            return $parent->load(self::PACKAGE_RELATIONS);
        });
    }

    public function updatePackage(int $id, array $initiation, array $implementation, array $typeIds): ChangeInitiation
    {
        return DB::transaction(function () use ($id, $initiation, $implementation, $typeIds) {
            $parent = ChangeInitiation::findOrFail($id);
            if (! empty($initiation)) {
                $parent->update($initiation);
            }

            $impl = $parent->implementation;
            if (! $impl) {
                $impl = ChangeImplementation::create(array_merge([
                    'status' => 'draft',
                    'priority' => 'medium',
                    'impact' => 'low',
                ], $implementation, [
                    'change_initiation_id' => $parent->id,
                ]));
            } elseif (! empty($implementation)) {
                $impl->update($implementation);
            }

            if (! empty($typeIds)) {
                $impl->changeTypes()->sync($typeIds);
            }

            return $this->findPackage($id);
        });
    }

    public function findPackage(int $id): ?ChangeInitiation
    {
        return ChangeInitiation::with(self::PACKAGE_RELATIONS)->find($id);
    }

    public function paginatePackages(int $perPage, array $filters, ?User $actor): LengthAwarePaginator
    {
        $query = ChangeInitiation::with(self::PACKAGE_LIST_RELATIONS);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['field_id'])) {
            $query->where('field_id', $filters['field_id']);
        }

        if ($actor && ! $actor->hasRole('admin')) {
            if ($actor->hasAnyRole(['kepala_tim', 'kepala_bidang'])) {
                // Team scope; null team sees nothing (deny-by-default).
                $actor->team_id === null
                    ? $query->whereRaw('false')
                    : $query->whereHas('initiator', fn ($q) => $q->where('team_id', $actor->team_id));
            } else {
                // staf / default: own packages only
                $query->where('initiator_id', $actor->id);
            }
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function transitionPackage(int $id, string $parentStatus, array $parentExtra = [], array $childExtra = []): void
    {
        if (! isset(self::CHILD_STATUS_MIRROR[$parentStatus])) {
            throw new InvalidArgumentException("Unknown package status: {$parentStatus}");
        }

        DB::transaction(function () use ($id, $parentStatus, $parentExtra, $childExtra) {
            $parent = ChangeInitiation::findOrFail($id);
            $parent->update(array_merge($parentExtra, ['status' => $parentStatus]));

            $impl = $parent->implementation;
            if ($impl) {
                $impl->update(array_merge($childExtra, [
                    'status' => self::CHILD_STATUS_MIRROR[$parentStatus],
                ]));
            }
        });
    }

    public function deletePackage(int $id): void
    {
        DB::transaction(function () use ($id) {
            $parent = ChangeInitiation::findOrFail($id);
            $impl = $parent->implementation;

            if ($impl) {
                // Attachments have no soft-delete; hard-delete rows only.
                $impl->attachments()->delete();
                $impl->delete();
            }

            $parent->delete();
        });
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

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function findInitiationWithRelations(int $id): ?ChangeInitiation
    {
        // ponytail: cutover debt — loads both legacy `implementations` (plural, for
        // InitiationResource) and new `implementation` (singular). Drop the plural
        // block in Phase 2/7 when old InitiationController + InitiationResource go.
        return ChangeInitiation::with([
            'field', 'initiator.team', 'reviewer',
            'implementations.evaluator', 'implementations.reviewer', 'implementations.responsible',
            'implementations.changeTypes', 'implementations.attachments',
            'implementation.evaluator', 'implementation.reviewer', 'implementation.responsible',
            'implementation.changeTypes', 'implementation.attachments',
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
