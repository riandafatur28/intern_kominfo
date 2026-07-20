<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 50px; size: A4; }
        * { box-sizing: border-box; }
        body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.5; margin: 0; padding: 0; }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        .header-table td { padding: 3px 5px; vertical-align: top; }
        .doc-header { border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
        .doc-title { text-align: center; font-weight: bold; font-size: 14px; text-transform: uppercase; }

        .section-title { font-weight: bold; text-transform: uppercase; margin: 15px 0 8px; font-size: 12px; border-bottom: 1px solid #999; padding-bottom: 3px; }
        .field-row { margin: 4px 0; }
        .field-label { font-weight: bold; display: inline-block; min-width: 180px; }
        .content-box { border: 1px solid #000; padding: 8px; margin: 5px 0; min-height: 60px; }

        .legal { font-size: 8px; text-align: justify; line-height: 1.3; margin: 15px 0; color: #333; }

        .signature-area { margin-top: 30px; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; padding: 0 10px; }
        .signature-role { font-weight: bold; margin-bottom: 50px; }
        .signature-box { position: relative; height: 70px; margin: 0 auto 5px; width: 200px; }
        .signature-box img { position: absolute; top: -55px; left: 0; height: 65px; width: auto; }
        .signature-name { font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; }
        .signature-nip { font-size: 10px; }
        .signature-position { font-size: 10px; }

        .qr-box { position: absolute; top: 0; right: 0; width: 60px; height: 60px; }
        .qr-box svg { width: 60px; height: 60px; }
    </style>
    <title>Form Inisiasi Perubahan</title>
</head>
<body>

    <div class="doc-header">
        <table class="header-table">
            <tr>
                <td><strong>No.</strong></td>
                <td>: {{ $docNumber }}</td>
            </tr>
            <tr>
                <td><strong>Tanggal</strong></td>
                <td>: {{ $tanggal }}</td>
            </tr>
        </table>
        <div class="doc-title">FORMULIR INISIASI PERUBAHAN</div>
    </div>

    <div class="section-title">Inisiator Perubahan</div>
    <div class="field-row"><span class="field-label">Bidang</span>: {{ $bidang }}</div>
    <div class="field-row"><span class="field-label">Hasil perubahan dibutuhkan pada tanggal</span>: {{ $neededByDate }}</div>

    <div class="section-title">Deskripsi Perubahan</div>
    <div class="content-box">{{ $description }}</div>

    <div class="section-title">Alasan Perubahan</div>
    <div class="content-box">{{ $reason }}</div>

    <div class="legal">
        Sesuai dengan ketentuan perundang-undangan yang berlaku, surat ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik Badan Siber dan Sandi Negara (BSrE-BSSN).
    </div>

    <div class="signature-area" style="position: relative;">
        <div class="qr-box">{!! $qrSvg !!}</div>
        <table class="signature-table">
            <tr>
                <td>
                    <div class="signature-role">Inisiator Perubahan</div>
                    <div class="signature-box"></div>
                    <div class="signature-name">{{ $initiatorName }}</div>
                    <div class="signature-nip">NIP. {{ $initiatorNip }}</div>
                    <div class="signature-position">{{ $initiatorPosition }}</div>
                </td>
                <td>
                    <div class="signature-role">Disetujui Oleh</div>
                    <div class="signature-box"></div>
                    <div class="signature-name">{{ $reviewerName }}</div>
                    <div class="signature-nip">NIP. {{ $reviewerNip }}</div>
                    <div class="signature-position">{{ $reviewerPosition }}</div>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
