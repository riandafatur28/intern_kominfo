<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WfhIncompleteAttendanceNotification extends Notification
{
    public function __construct(
        public Carbon $date,
        public array $missingSessions,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $sessionLabels = array_map(fn ($s) => match ($s) {
            'pagi' => 'Pagi',
            'siang' => 'Siang',
            'sore' => 'Sore',
            default => $s,
        }, $this->missingSessions);
        $sessionList = implode(', ', $sessionLabels);
        $dateStr = $this->date->format('d/m/Y');

        return (new MailMessage)
            ->subject('Pengingat Absensi WFH')
            ->greeting("Halo {$notifiable->name},")
            ->line("Anda belum menyelesaikan absensi WFH pada tanggal {$dateStr}.")
            ->line("Sesi yang belum diisi: **{$sessionList}**.")
            ->line('Silakan segera melakukan absensi untuk melengkapi kehadiran Anda.')
            ->salutation('Terima kasih');
    }
}
