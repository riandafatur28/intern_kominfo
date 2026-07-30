<?php

namespace Database\Factories;

use App\Models\Field;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

class TeamFactory extends Factory
{
    protected $model = Team::class;

    public function definition(): array
    {
        return [
            'field_id' => Field::factory(),
            'name' => $this->faker->company(),
        ];
    }
}
