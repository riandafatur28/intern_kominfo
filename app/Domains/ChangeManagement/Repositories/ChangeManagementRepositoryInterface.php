<?php

namespace App\Domains\ChangeManagement\Repositories;

use App\Domains\ChangeManagement\Models\ChangeImplementation;
use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Domains\Shared\Contracts\RepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChangeManagementRepositoryInterface extends RepositoryInterface
{
    // Initiation
    public function paginateInitiations(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function findInitiationWithRelations(int $id): ?ChangeInitiation;

    public function createInitiation(array $data): ChangeInitiation;

    public function countInitiationsByStatus(?int $fieldId = null): array;

    // Implementation
    public function findImplementationWithRelations(int $id): ?ChangeImplementation;

    public function createImplementation(int $initiationId, array $data, array $typeIds): ChangeImplementation;

    public function updateImplementation(int $id, array $data, array $typeIds): bool;

    public function submitImplementation(int $id, int $evaluatorId): void;

    public function reviewImplementation(int $id, array $data): void;

    public function addAttachments(int $implementationId, array $paths): void;
}
