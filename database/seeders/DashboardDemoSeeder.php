<?php

namespace Database\Seeders;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use App\Models\Field;
use App\Models\Team;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DashboardDemoSeeder extends Seeder
{
    /**
     * Seeds demo employees + WFH attendances/reports for July 2026 Fridays
     * so the Admin Dashboard shows realistic, backend-connected data.
     */
    public function run(): void
    {
        $field = Field::where('name', 'like', '%Aplikasi%')->first()
            ?? Field::create(['name' => 'Bidang Aplikasi Informatika']);

        $team = Team::where('field_id', $field->id)->first()
            ?? Team::create(['field_id' => $field->id, 'name' => 'Tim Aplikasi']);

        // Ensure 32 active staff in the field
        $target = 32;
        $existing = User::whereHas('team', fn ($q) => $q->where('field_id', $field->id))->count();

        for ($i = $existing; $i < $target; $i++) {
            $n = $i + 1;
            $user = User::firstOrCreate(
                ['email' => "pegawai{$n}@kominfo.go.id"],
                [
                    'team_id' => $team->id,
                    'name' => "Pegawai {$n}",
                    'nip' => str_pad((string) (199000000000000000 + $n), 18, '0'),
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

        $staff = User::whereHas('team', fn ($q) => $q->where('field_id', $field->id))
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        // Distribution per Friday: [approved, pending, checked_in_no_report, absent]
        $fridays = [
            '2026-07-03' => [26, 2, 2, 2],
            '2026-07-10' => [22, 2, 4, 4],
            '2026-07-17' => [20, 4, 4, 4],
        ];

        foreach ($fridays as $date => [$approved, $pending, $incomplete, $absent]) {
            $idx = 0;
            $carbon = Carbon::parse($date);

            $assign = function (int $count, string $mode) use (&$idx, $staff, $date, $carbon) {
                for ($k = 0; $k < $count && $idx < $staff->count(); $k++, $idx++) {
                    $user = $staff[$idx];

                    if ($mode === 'absent') {
                        continue; // no attendance, no report
                    }

                    // Determine which sessions this user attended
                    if ($mode === 'incomplete') {
                        // Checked in but incomplete: miss one session (vary by index)
                        $missPool = ['sore', 'siang'];
                        $missing = $missPool[$idx % count($missPool)];
                        $sessions = array_values(array_filter(
                            ['pagi', 'siang', 'sore'],
                            fn ($s) => $s !== $missing
                        ));
                    } else {
                        // approved / pending: complete attendance
                        $sessions = ['pagi', 'siang', 'sore'];
                    }

                    foreach ($sessions as $i => $session) {
                        WfhAttendance::firstOrCreate(
                            ['user_id' => $user->id, 'date' => $date, 'session' => $session],
                            [
                                'photo_path' => 'wfh-photos/demo.jpg',
                                'check_in_at' => $carbon->copy()->setTime(8 + ($i * 3), 0),
                            ]
                        );
                    }

                    if ($mode === 'incomplete') {
                        continue; // checked in but no report
                    }

                    $status = $mode; // approved or pending
                    $report = WfhReport::firstOrCreate(
                        ['user_id' => $user->id, 'report_date' => $date],
                        [
                            'status' => $status,
                            'maker_signed_at' => $carbon->copy()->setTime(16, 0),
                            'supervisor_signed_at' => $status === 'approved' ? $carbon->copy()->setTime(17, 0) : null,
                        ]
                    );

                    if ($report->wasRecentlyCreated) {
                        $report->activities()->create([
                            'start_time' => '08:00',
                            'end_time' => '10:00',
                            'activity' => 'Mengerjakan tugas harian',
                            'sort_order' => 0,
                        ]);
                    }
                }
            };

            $assign($approved, 'approved');
            $assign($pending, 'pending');
            $assign($incomplete, 'incomplete');
            $assign($absent, 'absent');
        }
    }
}
