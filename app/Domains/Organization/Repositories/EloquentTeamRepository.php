<?php

namespace App\Domains\Organization\Repositories;

use App\Models\Team;
use App\Repositories\EloquentRepository;
use Illuminate\Database\Eloquent\Collection;

class EloquentTeamRepository extends EloquentRepository implements TeamRepositoryInterface
{
    public function __construct(Team $model)
    {
        parent::__construct($model);
    }

    public function listForField(?int $fieldId = null, array $columns = ['id', 'name', 'leader_id', 'field_id']): Collection
    {
        $query = $this->model->newQuery();

        if ($fieldId !== null) {
            $query->where('field_id', $fieldId);
        }

        return $query->get($columns);
    }
}
