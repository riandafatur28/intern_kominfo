<?php

namespace Database\Factories\Domains\Auth;

use App\Domains\Auth\Models\PasswordResetOtp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<PasswordResetOtp>
 */
class PasswordResetOtpFactory extends Factory
{
    protected $model = PasswordResetOtp::class;

    public function definition(): array
    {
        return [
            'email' => fake()->email(),
            'code_hash' => Hash::make(Str::random(10)),
            'expires_at' => now()->addMinutes(15),
            'attempts' => 0,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expires_at' => now()->subMinute(),
        ]);
    }

    public function used(): static
    {
        return $this->state(fn () => [
            'used_at' => now(),
        ]);
    }
}
