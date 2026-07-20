<?php

namespace Database\Seeders;

use App\Models\Field;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KepalaBidangUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'kepala.bidang@kominfo.go.id'],
            [
                'team_id' => null,
                'name' => 'Kepala Bidang Demo',
                'nip' => '3333333333',
                'rank' => 'Pembina',
                'position' => 'Kepala Bidang',
                'password' => config('app.default_user_password'),
                'is_active' => true,
                'must_change_password' => false,
            ]
        );

        if (! $user->hasRole('kepala_bidang')) {
            $user->assignRole('kepala_bidang');
        }

        // Assign as head of the first field WITHOUT an existing head (created by AdminUserSeeder)
        $field = Field::whereNull('head_id')->first();
        if ($field) {
            $field->update(['head_id' => $user->id]);
            // Link to a team in the same field so $user->team->field resolves
            $team = DB::table('teams')->where('field_id', $field->id)->first();
            if ($team && ! $user->team_id) {
                $user->update(['team_id' => $team->id]);
            }
        }
    }
}
