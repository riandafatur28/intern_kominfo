<?php

namespace App\Domains\Organization\Repositories;

use App\Domains\Shared\Contracts\RepositoryInterface;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface extends RepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15, array $relations = ['team.field']): LengthAwarePaginator;

    public function findByNip(string $nip): ?User;

    public function findByEmail(string $email): ?User;
}
