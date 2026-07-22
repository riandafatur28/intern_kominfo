<?php

namespace Database\Seeders;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $field = Field::create(['name' => 'Bidang Aplikasi Informatika']);
        $team = Team::create(['field_id' => $field->id, 'name' => 'Tim Aplikasi']);

        $admin = User::create([
            'team_id' => $team->id,
            'name' => 'Administrator',
            'nip' => '0000000000',
            'email' => 'admin@kominfo.go.id',
            'password' => config('app.admin_password', Str::random(24)),
            'is_active' => true,
        ]);

        $admin->assignRole('admin');

        // Set circular refs
        $field->update(['head_id' => $admin->id]);
        $team->update(['leader_id' => $admin->id]);
    }
}
