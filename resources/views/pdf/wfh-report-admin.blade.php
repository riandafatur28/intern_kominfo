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
            margin: 14px 0 12px 0;
            text-decoration: underline;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .sub {
            text-align: center;
            font-size: 11px;
            color: #333;
            margin: -4px 0 10px 0;
        }

        /* === IDENTITAS === */
        .identitas { margin-bottom: 12px; }
        .identitas table { width: 100%; border-collapse: collapse; }
        .identitas td { padding: 2px 0; vertical-align: top; }
        .identitas td.label { width: 170px; }

        /* === TABEL STAF === */
        table.staff {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        table.staff th, table.staff td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
            vertical-align: middle;
        }
        table.staff th {
            background-color: #f0f0f0;
            text-align: center;
            font-weight: bold;
        }
        table.staff td.no { text-align: center; width: 30px; }
        table.staff td.nip { white-space: nowrap; }
        table.staff td.links { font-size: 9px; color: #333; line-height: 1.3; }

        /* === FOTO ABSENSI === */
        .photo {
            display: block;
            margin: 0 auto;
            max-width: 60px;
            max-height: 70px;
            width: auto;
            height: auto;
        }
        .no-photo { color: #999; font-size: 10px; }

        /* === BLOK TANDA TANGAN === */
        .signature-area { position: relative; margin-top: 4px; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; padding: 0 10px; }
        .signature-role { font-weight: bold; margin-bottom: 14px; }
        .signature-box { position: relative; height: 58px; margin: 0 auto 5px; width: 200px; }
        .signature-box img { position: absolute; top: -48px; left: 0; height: 54px; width: auto; }
        .signature-name { font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; }
        .signature-nip { font-size: 10px; margin-top: 1px; }

        .footer-bar { position: relative; margin-top: 6px; }
        .tanggal { text-align: right; margin-bottom: 6px; }

        .page-break { page-break-before: always; }
    </style>
    <title>Laporan WFH Tim - Admin</title>
</head>
<body>

    @php
        $tanggalId = \Illuminate\Support\Carbon::parse($tanggalPelaksanaan)->locale('id')->isoFormat('D MMMM Y');
    @endphp

    {{-- ================= PAGE 1: BUKTI KERJA ================= --}}
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
        LAPORAN PELAKSANAAN TUGAS WORK FROM HOME (WFH) - TIM
    </div>

    {{-- IDENTITAS --}}
    <div class="identitas">
        <table>
            <tr><td class="label">Nama Tim Kerja</td><td>: {{ $namaTim }}</td></tr>
            <tr><td class="label">Unit Kerja</td><td>: {{ $unitKerja }}</td></tr>
            <tr><td class="label">Tanggal Pelaksanaan</td><td>: {{ $tanggalId }}</td></tr>
        </table>
    </div>

    {{-- TABEL STAF --}}
    <table class="staff">
        <thead>
            <tr>
                <th style="width:30px;">No</th>
                <th style="width:200px;">Nama Pegawai</th>
                <th style="width:150px;">NIP</th>
                <th>Link Bukti Kerja</th>
            </tr>
        </thead>
        <tbody>
            @foreach($staff as $i => $member)
                @php $links = array_values(array_filter($member['links'] ?? [])); @endphp
                <tr>
                    <td class="no">{{ $i + 1 }}</td>
                    <td>{{ $member['name'] }}</td>
                    <td class="nip">{{ $member['nip'] }}</td>
                    <td class="links">
                        @forelse($links as $link)
                            <div>{{ $link }}</div>
                        @empty
                            <div>-</div>
                        @endforelse
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- FOOTER: TANGGAL --}}
    <div class="footer-bar">
        <div class="tanggal">Surabaya, {{ $tanggalId }}</div>
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

    {{-- ================= PAGE 2: BUKTI ABSENSI ================= --}}
    <div class="page-break"></div>

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
        LAPORAN BUKTI ABSENSI WORK FROM HOME - TIM
    </div>
    <div class="sub">{{ $unitKerja }} &bull; {{ $tanggalId }}</div>

    {{-- TABEL ABSENSI --}}
    @php $sessionNames = array_keys($sessions); @endphp
    <table class="staff">
        <thead>
            <tr>
                <th rowspan="2" style="width:30px;">No</th>
                <th rowspan="2" style="width:22%;">Nama Pegawai</th>
                <th colspan="{{ count($sessionNames) }}" style="text-align:center;">Sesi</th>
            </tr>
            <tr>
                @foreach($sessionNames as $s)
                    <th>{{ ucfirst($s) }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($staff as $i => $member)
                <tr>
                    <td class="no">{{ $i + 1 }}</td>
                    <td>{{ $member['name'] }}</td>
                    @foreach($sessionNames as $s)
                        @php $photo = $sessions[$s][$i]['photo'] ?? null; @endphp
                        <td>
                            @if ($photo)
                                <img class="photo" src="{{ $photo }}" alt="foto">
                            @else
                                <span class="no-photo">Belum diisi</span>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- FOOTER: TANGGAL --}}
    <div class="footer-bar">
        <div class="tanggal">Surabaya, {{ $tanggalId }}</div>
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
