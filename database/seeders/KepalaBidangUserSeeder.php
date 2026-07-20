<?php

namespace Database\Seeders;

use App\Models\Field;
use App\Models\User;
use Illuminate\Database\Seeder;

class KepalaBidangUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'kepala.bidang@kominfo.go.id'],
            [
                'team_id' => null,
                'name' => 'Kepala Bidang Demo',
                'nip' => '1111111111',
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

        // Assign as head of the first field (created by AdminUserSeeder)
        $field = Field::first();
        if ($field && ! $field->head_id) {
            $field->update(['head_id' => $user->id]);
        }
    }
}
