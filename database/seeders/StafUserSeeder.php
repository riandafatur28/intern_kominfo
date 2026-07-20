<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class StafUserSeeder extends Seeder
{
    public function run(): void
    {
        $team = Team::first();

        $user = User::firstOrCreate(
            ['email' => 'staf@kominfo.go.id'],
            [
                'team_id' => $team?->id,
                'name' => 'Staf Demo',
                'nip' => '3333333333',
                'rank' => 'Penata Muda',
                'position' => 'Staf',
                'password' => config('app.default_user_password'),
                'is_active' => true,
                'must_change_password' => false,
            ]
        );

        if (! $user->hasRole('staf')) {
            $user->assignRole('staf');
        }
    }
}
