<?php

namespace App\Domains\ChangeManagement\Repositories;

use App\Domains\ChangeManagement\Models\ChangeImplementation;
use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Domains\Shared\Contracts\RepositoryInterface;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChangeManagementRepositoryInterface extends RepositoryInterface
{
    // Package API
    public function createPackage(array $initiation, array $implementation, array $typeIds): ChangeInitiation;

    public function updatePackage(int $id, array $initiation, array $implementation, array $typeIds): ChangeInitiation;

    public function findPackage(int $id): ?ChangeInitiation;

    public function paginatePackages(int $perPage, array $filters, ?User $actor): LengthAwarePaginator;

    public function transitionPackage(int $id, string $parentStatus, array $parentExtra = [], array $childExtra = []): void;

    public function deletePackage(int $id): void;

    // Legacy serial API (kept until Phase 2 cutover)
    public function paginateInitiations(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function findInitiationWithRelations(int $id): ?ChangeInitiation;

    public function createInitiation(array $data): ChangeInitiation;

    public function findImplementationWithRelations(int $id): ?ChangeImplementation;

    public function createImplementation(int $initiationId, array $data, array $typeIds): ChangeImplementation;

    public function updateImplementation(int $id, array $data, array $typeIds): bool;

    public function submitImplementation(int $id, int $evaluatorId): void;

    public function reviewImplementation(int $id, array $data): void;

    public function addAttachments(int $implementationId, array $paths): void;
}
