<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class KepalaTimUserSeeder extends Seeder
{
    public function run(): void
    {
        $team = Team::first();

        $user = User::firstOrCreate(
            ['email' => 'kepala.tim@kominfo.go.id'],
            [
                'team_id' => $team?->id,
                'name' => 'Kepala Tim Demo',
                'nip' => '2222222222',
                'rank' => 'Pembina Tingkat I',
                'position' => 'Kepala Tim',
                'password' => config('app.default_user_password'),
                'is_active' => true,
                'must_change_password' => false,
            ]
        );

        if (! $user->hasRole('kepala_tim')) {
            $user->assignRole('kepala_tim');
        }

        // Assign as leader of the first team
        if ($team && ! $team->leader_id) {
            $team->update(['leader_id' => $user->id]);
        }
    }
}
