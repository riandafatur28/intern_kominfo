<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 60px 50px 40px 50px; size: A4; }
        * { box-sizing: border-box; }
        body {
            font-family: "DejaVu Sans", Arial, sans-serif;
            font-size: 11px;
            color: #000;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        /* === KOP SURAT === */
        .kop-surat {
            display: table;
            width: 100%;
            margin-bottom: 5px;
            padding-bottom: 8px;
            border-bottom: 3px solid #000;
        }
        .logo {
            display: table-cell;
            width: 80px;
            height: 85px;
            vertical-align: middle;
            margin-right: 15px;
        }
        .logo img { width: 60px; height: 64px; object-fit: contain; }
        .kop-text {
            display: table-cell;
            text-align: center;
            vertical-align: middle;
        }
        .kop-text h3 { margin: 0; font-size: 16px; text-transform: uppercase; font-weight: bold; }
        .kop-text h2 { margin: 2px 0; font-size: 20px; text-transform: uppercase; font-weight: bold; }
        .kop-text p { margin: 3px 0 0; font-size: 9px; }

        /* === JUDUL === */
        .judul {
            text-align: center;
            margin: 18px 0 15px 0;
            text-decoration: underline;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
        }

        /* === IDENTITAS === */
        .identitas { margin-bottom: 15px; }
        .identitas table { width: 100%; border-collapse: collapse; }
        .identitas td { padding: 2px 0; vertical-align: top; }
        .identitas td.label { width: 170px; }

        /* === TABEL KEGIATAN === */
        table.kegiatan {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        table.kegiatan th, table.kegiatan td {
            border: 1px solid #000;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
        }
        table.kegiatan th {
            background-color: #f0f0f0;
            text-align: center;
            font-weight: bold;
        }
        table.kegiatan td.no { text-align: center; width: 30px; }
        table.kegiatan td.waktu { width: 120px; white-space: nowrap; }
        table.kegiatan td.links { font-size: 9px; color: #333; line-height: 1.3; }

        /* === BLOK TANDA TANGAN === */
        .signature-area { position: relative; margin-top: 20px; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; padding: 0 10px; }
        .signature-role { font-weight: bold; margin-bottom: 50px; }
        .signature-box { position: relative; height: 70px; margin: 0 auto 5px; width: 200px; }
        .signature-box img { position: absolute; top: -55px; left: 0; height: 65px; width: auto; }
        .signature-name { font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; }
        .signature-nip { font-size: 10px; margin-top: 1px; }

        /* === TEMPAT/TANGGAL + QR === */
        .footer-bar { position: relative; margin-top: 10px; }
        .tanggal { text-align: right; margin-bottom: 8px; margin-right: 72px; }
        .qr-box { position: absolute; top: 0; right: 0; width: 60px; height: 60px; }
        .qr-box img { width: 60px; height: 60px; }
    </style>
    <title>Laporan WFH</title>
</head>
<body>

    @php
        // Controller passes isoFormat('D MMMM Y') in app locale ('en') → re-format to Indonesian
        $tanggalId = \Illuminate\Support\Carbon::parse($tanggalPelaksanaan)->locale('id')->isoFormat('D MMMM Y');

        // DomPDF (3.1.5) tidak merender SVG inline/data-uri → rasterisasi QR SVG → PNG via GD (scanline evenodd fill)
        if (! function_exists('svgQrToPngBase64')) {
            function svgQrToPngBase64(string $svg, int $outSize = 120): string
            {
                preg_match('/width="(\d+)"/', $svg, $mw);
                $size = (int) $mw[1];
                preg_match('/transform="scale\(([\d.]+)\)"/', $svg, $m);
                $scale = (float) $m[1];
                preg_match('/d="([^"]+)"/', $svg, $md);
                $d = $md[1];
                $grid = (int) round($size / $scale);

                preg_match_all('/([MLHVZ])\s*(-?\d+)?\s*(-?\d+)?/', $d, $toks, PREG_SET_ORDER);
                $segs = [];
                $x = 0; $y = 0; $sx = 0; $sy = 0;
                foreach ($toks as $t) {
                    $cmd = $t[1];
                    if ($cmd === 'M') { $x = (int) $t[2]; $y = (int) $t[3]; $sx = $x; $sy = $y; }
                    elseif ($cmd === 'L') { $nx = (int) $t[2]; $ny = (int) $t[3]; $segs[] = [$x, $y, $nx, $ny]; $x = $nx; $y = $ny; }
                    elseif ($cmd === 'H') { $nx = (int) $t[2]; $segs[] = [$x, $y, $nx, $y]; $x = $nx; }
                    elseif ($cmd === 'V') { $ny = (int) $t[2]; $segs[] = [$x, $y, $x, $ny]; $y = $ny; }
                    elseif ($cmd === 'Z') { $segs[] = [$x, $y, $sx, $sy]; $x = $sx; $y = $sy; }
                }

                $img = imagecreatetruecolor($grid, $grid);
                $white = imagecolorallocate($img, 255, 255, 255);
                $black = imagecolorallocate($img, 0, 0, 0);
                imagefill($img, 0, 0, $white);

                for ($row = 0; $row < $grid; $row++) {
                    $xs = [];
                    foreach ($segs as $s) {
                        $y1 = $s[1]; $y2 = $s[3];
                        if ($y1 === $y2) {
                            continue;
                        }
                        if (($y1 <= $row && $row < $y2) || ($y2 <= $row && $row < $y1)) {
                            $ix = $s[0] + ($s[2] - $s[0]) * ($row - $y1) / ($y2 - $y1);
                            $xs[] = (int) round($ix);
                        }
                    }
                    sort($xs);
                    for ($k = 0; $k + 1 < count($xs); $k += 2) {
                        $a = max(0, $xs[$k]);
                        $b = min($grid, $xs[$k + 1]);
                        for ($c = $a; $c < $b; $c++) {
                            imagesetpixel($img, $c, $row, $black);
                        }
                    }
                }

                $out = imagecreatetruecolor($outSize, $outSize);
                imagecopyresampled($out, $img, 0, 0, 0, 0, $outSize, $outSize, $grid, $grid);
                ob_start();
                imagepng($out);
                return base64_encode(ob_get_clean());
            }
        }
        $qrPng = ($isApproved && $qrSvg) ? svgQrToPngBase64($qrSvg, 120) : null;

        // Format waktu kegiatan: '2026-07-31 08:00:00 – 2026-07-31 11:00:00' → '08.00 - 11.00 WIB'
        $fmtWaktu = function (string $raw): string {
            $parts = array_map('trim', explode('–', $raw));
            $fmt = function ($p) {
                return preg_match('/\d{4}-\d{2}-\d{2} (\d{2}:\d{2})/', $p, $m)
                    ? str_replace(':', '.', $m[1])
                    : $p;
            };
            return implode(' - ', array_map($fmt, $parts)) . ' WIB';
        };
    @endphp

    {{-- KOP SURAT --}}
    <div class="kop-surat">
        <div class="logo"><img src="{{ public_path('assets/logo.png') }}" alt="logo"></div>
        <div class="kop-text">
            <h3>PEMERINTAH PROVINSI JAWA TIMUR</h3>
            <h2>DINAS KOMUNIKASI DAN INFORMATIKA</h2>
            <p>Jalan Ahmad Yani Nomor 242-244, Gayungan, Surabaya, Jawa Timur 60235<br>
            Tlp. (031) 8294608, Fak. (031) 8294517, Laman kominfo.jatimprov.go.id, Pos-el kominfo@jatimprov.go.id</p>
        </div>
    </div>

    {{-- JUDUL --}}
    <div class="judul">
        LAPORAN PELAKSANAAN TUGAS WORK FROM HOME (WFH)
    </div>

    {{-- IDENTITAS --}}
    <div class="identitas">
        <table>
            <tr><td class="label">Nama</td><td>: {{ $nama }}</td></tr>
            <tr><td class="label">NIP</td><td>: {{ $nip }}</td></tr>
            <tr><td class="label">Pangkat/Gol</td><td>: {{ $pangkat }}</td></tr>
            <tr><td class="label">Jabatan</td><td>: {{ $jabatan }}</td></tr>
            <tr><td class="label">Unit Kerja</td><td>: {{ $unitKerja }}</td></tr>
            <tr><td class="label">Tanggal Pelaksanaan</td><td>: {{ $tanggalId }}</td></tr>
        </table>
    </div>

    {{-- TABEL KEGIATAN --}}
    <table class="kegiatan">
        <thead>
            <tr>
                <th style="width:30px;">No</th>
                <th style="width:120px;">Waktu Pelaksanaan</th>
                <th>Kegiatan</th>
                <th style="width:180px;">Link Bukti Kerja</th>
            </tr>
        </thead>
        <tbody>
            @forelse($kegiatan as $i => $item)
                @php $links = array_values(array_filter($item['links'] ?? [])); @endphp
                <tr>
                    <td class="no">{{ $i + 1 }}.</td>
                    <td class="waktu">{{ $fmtWaktu($item['waktu']) }}</td>
                    <td>{{ $item['kegiatan'] }}</td>
                    <td class="links">
                        @forelse($links as $link)
                            <div>{{ $link }}</div>
                        @empty
                            <div>-</div>
                        @endforelse
                    </td>
                </tr>
            @empty
                <tr><td colspan="4" style="text-align:center;color:#666;">Belum ada kegiatan.</td></tr>
            @endforelse
        </tbody>
    </table>

    {{-- FOOTER: TANGGAL + QR --}}
    <div class="footer-bar">
        <div class="tanggal">Surabaya, {{ $tanggalId }}</div>
        <div class="qr-box">
            @if ($qrPng)
                <img src="data:image/png;base64,{{ $qrPng }}" alt="qrcode">
            @endif
        </div>
    </div>

    {{-- BLOK TANDA TANGAN --}}
    <div class="signature-area">
        <table class="signature-table">
            <tr>
                <td>
                    <div class="signature-role">Yang Membuat Laporan</div>
                    <div class="signature-box">
                        @if ($signatureMakerPath)
                            <img src="{{ $signatureMakerPath }}" alt="signature">
                        @endif
                    </div>
                    <div class="signature-name">{{ $makerName }}</div>
                    <div class="signature-nip">NIP. {{ $makerNip }}</div>
                </td>
                <td>
                    <div class="signature-role">Atasan Langsung</div>
                    <div class="signature-box">
                        @if ($isApproved && $signatureSupervisorPath)
                            <img src="{{ $signatureSupervisorPath }}" alt="signature">
                        @endif
                    </div>
                    <div class="signature-name">{{ $supervisorName }}</div>
                    <div class="signature-nip">NIP. {{ $supervisorNip }}</div>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
