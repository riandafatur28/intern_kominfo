<?php

namespace Database\Factories\Domains\ChangeManagement\Models;

use App\Domains\ChangeManagement\Models\ChangeInitiation;
use App\Models\Field;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChangeInitiationFactory extends Factory
{
    protected $model = ChangeInitiation::class;

    public function definition(): array
    {
        return [
            'field_id' => Field::factory(),
            'initiator_id' => User::factory(),
            'doc_number' => str_pad((string) fake()->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT) . '/9/1.1/114/' . date('Y'),
            'initiation_date' => now()->toDateString(),
            'description' => $this->faker->sentence(),
            'reason' => $this->faker->paragraph(),
            'status' => 'draft',
        ];
    }
}
