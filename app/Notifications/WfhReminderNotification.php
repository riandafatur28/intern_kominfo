<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WfhReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $userName,
        private string $currentTime,
        private string $currentDate,
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pengingat WFH — Anda belum absen dan belum melaporkan kegiatan')
            ->view('emails.wfh-reminder', [
                'nama' => $this->userName,
                'jam' => $this->currentTime,
                'tanggal' => $this->currentDate,
            ]);
    }

    public function toArray($notifiable): array
    {
        return [
            'user_id' => $notifiable->id,
            'date' => $this->currentDate,
        ];
    }
}
