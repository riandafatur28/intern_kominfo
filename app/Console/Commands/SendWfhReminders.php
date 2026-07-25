<?php

namespace App\Console\Commands;

use App\Domains\Wfh\Models\WfhReminderDispatch;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\WfhReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendWfhReminders extends Command
{
    protected $signature = 'wfh:send-reminders';

    protected $description = 'Send WFH reminder emails to users who have not checked in nor submitted a report today';

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $today = now()->toDateString();

        // 1. Skip weekend / non-allowed days
        $allowedDays = Setting::get('wfh_allowed_days', [1, 2, 3, 4, 5]);
        if (! in_array(now()->dayOfWeekIso, $allowedDays)) {
            $this->info('Hari ini bukan hari WFH. Lewati.');

            return Command::SUCCESS;
        }

        // 2. Skip if before configured start time
        $startTime = Setting::get('wfh_notify_start_time', '15:00');
        if (now()->format('H:i') < $startTime) {
            $this->info("Belum waktunya notify ($startTime). Lewati.");

            return Command::SUCCESS;
        }

        // 3. Skip if already dispatched today (idempotency)
        if (WfhReminderDispatch::where('dispatch_date', $today)->exists()) {
            $this->info('Notifikasi sudah dikirim hari ini. Lewati.');

            return Command::SUCCESS;
        }

        // 4. Find users who have NEITHER attendance NOR report today
        $noAttendanceIds = collect($this->wfhRepository->getUsersWithoutAttendance($today))->pluck('id');
        $noReportIds = collect($this->wfhRepository->getUsersWithoutReport($today))->pluck('id');
        $bothMissingIds = $noAttendanceIds->intersect($noReportIds);

        if ($bothMissingIds->isEmpty()) {
            $this->info('Tidak ada user yang perlu diingatkan.');
        } else {
            $users = User::whereIn('id', $bothMissingIds)->get();
            $count = $users->count();

            $now = now();
            Notification::send($users, new WfhReminderNotification(
                userName: '',
                currentTime: $now->format('H:i'),
                currentDate: $now->format('d-m-Y'),
            ));
            $this->info("Notifikasi dikirim ke {$count} user.");
        }

        // 5. Record dispatch (idempotency guard)
        WfhReminderDispatch::create([
            'dispatch_date' => $today,
            'dispatched_at' => now(),
        ]);

        return Command::SUCCESS;
    }
}
