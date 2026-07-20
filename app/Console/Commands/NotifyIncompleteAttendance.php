<?php

namespace App\Console\Commands;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Models\User;
use App\Notifications\WfhIncompleteAttendanceNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class NotifyIncompleteAttendance extends Command
{
    protected $signature = 'wfh:notify-incomplete-attendance {--date= : Target date (default: today)}';

    protected $description = 'Kirim notifikasi ke user yang belum lengkap absensi WFH';

    private const SESSIONS = ['pagi', 'siang', 'sore'];

    public function handle(): void
    {
        $date = $this->option('date') ?? Carbon::today()->toDateString();

        // Get all attendance records for the date — 1 query
        $attendanceMap = []; // user_id => set of sessions
        WfhAttendance::where('date', $date)
            ->get(['user_id', 'session'])
            ->each(function ($a) use (&$attendanceMap) {
                $attendanceMap[$a->user_id][$a->session] = true;
            });

        // Get all active users
        $users = User::where('is_active', true)->get();

        $sent = 0;
        $skipped = 0;

        foreach ($users as $user) {
            $attended = $attendanceMap[$user->id] ?? [];
            $missing = array_values(array_filter(self::SESSIONS, fn ($s) => ! isset($attended[$s])));

            if (empty($missing)) {
                $skipped++;
                continue; // complete — skip
            }

            $cacheKey = "wfh:notify:{$user->id}:{$date}";
            if (Cache::has($cacheKey)) {
                $skipped++;
                continue; // already notified today
            }

            $user->notify(new WfhIncompleteAttendanceNotification(Carbon::parse($date), $missing));
            Cache::put($cacheKey, true, Carbon::tomorrow()->startOfDay());
            $sent++;
        }

        $this->info("Sent to {$sent} users, skipped {$skipped} (complete or dedup).");
    }
}
