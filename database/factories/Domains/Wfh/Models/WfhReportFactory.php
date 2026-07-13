<?php

namespace Database\Factories\Domains\Wfh\Models;

use App\Domains\Wfh\Models\WfhReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class WfhReportFactory extends Factory
{
    protected $model = WfhReport::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'report_date' => $this->faker->date(),
            'status' => 'draft',
        ];
    }
}
