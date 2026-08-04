<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 40px; size: A4; }
        * { box-sizing: border-box; }
        body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.5; margin: 0; padding: 0; }

        /* ===== Header table: logo+title cell (rowspan) + No./Tanggal/Halaman ===== */
        .doc-header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .doc-header-table td { border: 1px solid #000; padding: 6px 10px; vertical-align: middle; }
        .kop-cell { width: 62%; }
        .kop-inner { width: 100%; border-collapse: collapse; }
        .kop-inner td { border: none; padding: 0; }
        .kop-logo { width: 60px; text-align: center; vertical-align: middle; }
        .kop-logo img { width: 48px; height: auto; }
        .kop-title { font-weight: bold; font-size: 15px; text-transform: uppercase; text-align: center; }
        .meta-label { width: 70px; font-weight: bold; }
        .meta-value { width: auto; }

        .section-title { font-weight: bold; text-transform: uppercase; margin: 16px 0 8px; font-size: 12px; }

        .kv-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
        .kv-table td { padding: 3px 0; vertical-align: top; }
        .kv-label { width: 220px; }
        .kv-sep { width: 12px; }

        .legal { font-size: 8px; text-align: justify; line-height: 1.3; margin: 20px 0 10px; color: #333; }

        .signature-area { margin-top: 20px; position: relative; }
        .qr-box { position: absolute; top: 0; left: 0; width: 55px; height: 55px; }
        .qr-box svg { width: 55px; height: 55px; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; padding: 0 10px; }
        .signature-table td.sign-col { text-align: right; }
        .signature-role { font-weight: bold; margin-bottom: 4px; }
        .signature-position { margin-bottom: 45px; }
        .signature-box { position: relative; height: 60px; margin: 0 0 5px; width: 200px; display: inline-block; }
        .signature-box img { position: absolute; top: -25px; right: 0; height: 60px; width: auto; }
        .signature-name { font-weight: bold; text-decoration: underline; margin-top: 2px; }
        .signature-nip { font-size: 10px; }
    </style>
    <title>Form Inisiasi Perubahan</title>
</head>
<body>

    <table class="doc-header-table">
        <tr>
            <td class="kop-cell" rowspan="3">
                <table class="kop-inner">
                    <tr>
                        <td class="kop-logo"><img src="{{ public_path('images/logo-jatim.png') }}" alt="Logo"></td>
                        <td class="kop-title">Formulir Inisiasi Perubahan</td>
                    </tr>
                </table>
            </td>
            <td class="meta-label">No.</td>
            <td class="meta-value">{{ $docNumber }}</td>
        </tr>
        <tr>
            <td class="meta-label">Tanggal</td>
            <td class="meta-value">{{ $tanggal }}</td>
        </tr>
        <tr>
            <td class="meta-label">Halaman</td>
            <td class="meta-value">1</td>
        </tr>
    </table>

    <div class="section-title">Inisiator Perubahan</div>
    <table class="kv-table">
        <tr>
            <td class="kv-label">Bidang</td>
            <td class="kv-sep">:</td>
            <td>{{ $bidang }}</td>
        </tr>
        <tr>
            <td class="kv-label">Hasil perubahan dibutuhkan pada tanggal</td>
            <td class="kv-sep">:</td>
            <td>{{ $neededByDate }}</td>
        </tr>
    </table>

    <table class="kv-table" style="margin-top: 10px;">
        <tr>
            <td class="kv-label">Deskripsi Perubahan</td>
            <td class="kv-sep">:</td>
            <td>{{ $description }}</td>
        </tr>
        <tr>
            <td class="kv-label">Alasan Perubahan</td>
            <td class="kv-sep">:</td>
            <td>{{ $reason }}</td>
        </tr>
    </table>

    <div class="legal">
        Sesuai dengan ketentuan perundang-undangan yang berlaku, surat ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik Badan Siber dan Sandi Negara (BSrE-BSSN).
    </div>

    <div class="signature-area">
        <div class="qr-box">{!! $qrSvg !!}</div>
        <table class="signature-table">
            <tr>
                <td></td>
                <td class="sign-col">
                    <div class="signature-role">Inisiator Perubahan</div>
                    <div class="signature-position">{{ $initiatorPosition }}</div>
                    <div class="signature-box">
                        <img src="{{ $initiatorSig }}" alt="signature">
                    </div>
                    <div class="signature-name">{{ $initiatorName }}</div>
                    <div class="signature-nip">NIP. {{ $initiatorNip }}</div>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
