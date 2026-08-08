<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password — Kode OTP</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h1 style="color: #1a73e8;">Reset Password</h1>

    <p>Halo <strong>{{ $name }}</strong>,</p>

    <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda. Gunakan kode OTP berikut untuk melanjutkan:</p>

    <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a73e8;">{{ $code }}</span>
    </div>

    <p>Kode OTP berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku sebagai administrator.</p>

    <p style="color: #888; font-size: 12px;">Abaikan email ini jika Anda tidak merasa melakukan permintaan reset password.</p>

    <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;">

    <p style="color: #888; font-size: 12px;">
        — Tim IT<br>
        Pesan ini dikirim otomatis oleh sistem e-office.
    </p>
</body>
</html>
