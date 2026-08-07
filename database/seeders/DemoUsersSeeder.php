<?php

namespace Database\Seeders;

use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Database\Seeders\Concerns\SeedsPlaceholderSignature;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    use SeedsPlaceholderSignature;

    
    public function run(): void
    {
        // Same field as AdminUserSeeder's "Bidang Aplikasi Informatika" — firstOrCreate
        // reuses that existing row instead of creating a second, different field, so
        // staf/kepala_tim/kepala_bidang's packages land under the field the reference
        // PDFs (and the "Bidang" auto-fill) are meant to show. Team stays distinct
        // ("Tim Pengembangan") — one bidang can have more than one team.
        $field = Field::firstOrCreate(
            ['name' => 'Bidang Pengembangan Aplikasi'],
        );

        $team = Team::firstOrCreate(
            ['name' => 'Tim Pengembangan'],
            ['field_id' => $field->id],
        );
        // Force-correct even if the team already existed under the old field (from a
        // previous seed run before this fix) — firstOrCreate only applies field_id on
        // create, not on an existing match.
        $team->update(['field_id' => $field->id]);

        $staf = User::firstOrCreate(
            ['email' => 'staf@kominfo.go.id'],
            [
                'team_id' => $team->id,
                'name' => 'Siti Staf',
                'nip' => '1111111111',
                'password' => 'password123',
                'is_active' => true,
            ],
        );
        $staf->assignRole('staf');
        // "Jabatan: staf" — matches dokumen implementasi sistem.pdf's "Dievaluasi Oleh" block.
        $this->applyPlaceholderIdentity($staf, 'staf');

        $kepalaTim = User::firstOrCreate(
            ['email' => 'kepala.tim@kominfo.go.id'],
            [
                'team_id' => $team->id,
                'name' => 'Koko Kepala Tim',
                'nip' => '2222222222',
                'password' => 'password123',
                'is_active' => true,
            ],
        );
        $kepalaTim->assignRole('kepala_tim');
        // "Jabatan: Kepala Tim Aplikasi" — matches dokumen inisiasi/implementasi sistem.pdf.
        $this->applyPlaceholderIdentity($kepalaTim, 'Kepala Tim Aplikasi');

        $kepalaBidang = User::firstOrCreate(
            ['email' => 'kepala.bidang@kominfo.go.id'],
            [
                'team_id' => $team->id,
                'name' => 'Budi Kepala Bidang',
                'nip' => '3333333333',
                'password' => 'password123',
                'is_active' => true,
            ],
        );
        $kepalaBidang->assignRole('kepala_bidang');
        $this->applyPlaceholderIdentity($kepalaBidang, 'Kepala Bidang');

        // Circular references — KT is team leader, KB is field head.
        $team->update(['leader_id' => $kepalaTim->id]);
        $field->update(['head_id' => $kepalaBidang->id]);
    }
}
