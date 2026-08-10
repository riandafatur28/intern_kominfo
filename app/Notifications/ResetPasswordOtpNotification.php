<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordOtpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $code,
        private string $name,
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset Password — Kode OTP')
            ->view('emails.reset-password-otp', [
                'code' => $this->code,
                'name' => $this->name,
            ]);
    }
}
