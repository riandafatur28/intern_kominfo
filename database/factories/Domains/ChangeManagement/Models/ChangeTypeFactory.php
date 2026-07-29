<?php

namespace Database\Factories\Domains\ChangeManagement\Models;

use App\Domains\ChangeManagement\Models\ChangeType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChangeType>
 */
class ChangeTypeFactory extends Factory
{
    protected $model = ChangeType::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
        ];
    }
}
