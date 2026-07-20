<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Reset Password</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 480px; margin: 0 auto; padding: 24px; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 16px 0; }
        .footer { font-size: 12px; color: #6b7280; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Password</h2>
        <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>

        <p>Gunakan kode OTP berikut untuk melanjutkan:</p>
        <div class="code">{{ $code }}</div>

        <p>Kode ini berlaku selama <strong>{{ $expiresInMinutes }} menit</strong>.</p>
        <p>Abaikan email ini jika Anda tidak meminta reset password.</p>

        <div class="footer">
            <p>Email ini dikirim secara otomatis, jangan membalas email ini.</p>
            <p>&copy; {{ date('Y') }} Kominfo Jatimprov</p>
        </div>
    </div>
</body>
</html>
