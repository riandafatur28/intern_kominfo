<?php

namespace Tests\Feature;

use App\Domains\Auth\Mail\ResetPasswordOtpMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ResetPasswordOtpMailTest extends TestCase
{
    use RefreshDatabase;

    public function test_mail_contains_otp_code(): void
    {
        $mailable = new ResetPasswordOtpMail('123456', 15);

        $this->assertEquals('Kode Reset Password', $mailable->envelope()->subject);
        $this->assertStringContainsString('123456', $mailable->render());
        $this->assertStringContainsString('15 menit', $mailable->render());
    }

    public function test_send_via_resend_mailer(): void
    {
        Mail::fake();

        Mail::mailer('resend')->to('test@example.com')->send(
            new ResetPasswordOtpMail('654321', 15)
        );

        Mail::mailer('resend')->assertSent(ResetPasswordOtpMail::class, function ($mail) {
            return $mail->hasTo('test@example.com');
        });
    }
}
