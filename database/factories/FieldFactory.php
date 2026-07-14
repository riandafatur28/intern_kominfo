<?php

namespace Database\Factories;

use App\Models\Field;
use Illuminate\Database\Eloquent\Factories\Factory;

class FieldFactory extends Factory
{
    protected $model = Field::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word().' Bidang',
        ];
    }
}
