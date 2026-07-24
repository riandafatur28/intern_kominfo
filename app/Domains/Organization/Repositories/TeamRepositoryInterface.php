<?php

namespace App\Domains\Organization\Repositories;

use App\Domains\Shared\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface TeamRepositoryInterface extends RepositoryInterface
{
    /**
     * List teams, optionally filtered by field (bidang).
     * Soft-deleted teams are excluded by default.
     */
    public function listForField(?int $fieldId = null, array $columns = ['id', 'name', 'leader_id', 'field_id']): Collection;
}
