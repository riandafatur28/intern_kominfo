<?php

namespace Database\Seeders;

use App\Domains\ChangeManagement\Models\ChangeType;
use Illuminate\Database\Seeder;

class ChangeTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['Hardware', 'Network', 'Software', 'Utilities', 'Aplikasi', 'Prosedur', 'Operating System', 'Personil'];

        foreach ($types as $type) {
            ChangeType::firstOrCreate(['name' => $type]);
        }
    }
}
