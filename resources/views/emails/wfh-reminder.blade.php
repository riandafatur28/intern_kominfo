<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pengingat WFH</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h1 style="color: #1a73e8;">Pengingat WFH</h1>

    <p>Halo <strong>{{ $nama }}</strong>,</p>

    <p>Pada pukul {{ $jam }}, tanggal {{ $tanggal }}, tercatat Anda <strong>belum melakukan absensi WFH</strong> dan <strong>belum mengirimkan laporan kegiatan WFH</strong> hari ini.</p>

    <p>Mohon segera melakukan absensi dan pengisian laporan kegiatan di sistem e-office.</p>

    <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;">

    <p style="color: #888; font-size: 12px;">
        — Tim IT<br>
        Pesan ini dikirim otomatis oleh sistem e-office.
    </p>
</body>
</html>