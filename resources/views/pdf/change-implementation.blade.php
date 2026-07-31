<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 50px; size: A4; }
        * { box-sizing: border-box; }
        body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 10px; color: #000; line-height: 1.4; margin: 0; padding: 0; }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        .header-table td { padding: 2px 5px; }
        .doc-header { border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 12px; }
        .doc-title { text-align: center; font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 5px; }

        .section { margin-bottom: 12px; }
        .section-title { font-weight: bold; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #999; padding-bottom: 2px; margin-bottom: 5px; }

        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
        .info-table td.label { font-weight: bold; background-color: #f0f0f0; width: 160px; }

        .legal { font-size: 8px; text-align: justify; line-height: 1.3; margin: 10px 0; color: #333; }

        .signature-block { margin-top: 15px; }
        .sig-table { width: 100%; border-collapse: collapse; }
        .sig-table td { width: 33%; text-align: center; vertical-align: top; padding: 0 5px; }
        .sig-role { font-weight: bold; margin-bottom: 40px; font-size: 10px; }
        .sig-box { position: relative; height: 60px; margin: 0 auto 3px; width: 160px; }
        .sig-box img { position: absolute; top: -45px; left: 0; height: 55px; width: auto; }
        .sig-name { font-weight: bold; border-top: 1px solid #000; padding-top: 2px; font-size: 10px; }
        .sig-nip { font-size: 9px; }
        .sig-position { font-size: 9px; }

        .status-box { display: inline-block; border: 1px solid #000; padding: 2px 8px; font-weight: bold; margin: 2px; }
        .status-active { background-color: #d4edda; }
    </style>
    <title>Form Implementasi Perubahan</title>
</head>
<body>

    <div class="doc-header">
        <table class="header-table">
            <tr>
                <td><strong>Nomor</strong></td>
                <td>: {{ $docNumber }}</td>
            </tr>
            <tr>
                <td><strong>Tanggal</strong></td>
                <td>: {{ $tanggal }}</td>
            </tr>
        </table>
    </div>

    {{-- EVALUASI DAMPAK PERUBAHAN --}}
    <div class="section">
        <div class="section-title">Evaluasi Dampak Perubahan</div>
        <table class="info-table">
            <tr>
                <td class="label">Tipe Perubahan</td>
                <td>{{ $changeTypes }}</td>
            </tr>
            <tr>
                <td class="label">Prioritas Perubahan</td>
                <td>{{ strtoupper($priority) }}</td>
            </tr>
            <tr>
                <td class="label">Dampak Perubahan</td>
                <td>{{ strtoupper($impact) }}</td>
            </tr>
            <tr>
                <td class="label">Dampak terhadap Lingkungan</td>
                <td>{{ $productionImpact }}</td>
            </tr>
            <tr>
                <td class="label">Upaya / Tindakan</td>
                <td>{{ $requiredEffort }}</td>
            </tr>
            <tr>
                <td class="label">Kebutuhan Biaya</td>
                <td>{{ $costNeeded }} — {{ $costAmount }}</td>
            </tr>
            <tr>
                <td class="label">Kebutuhan Sumber Daya</td>
                <td>{{ $resources }}</td>
            </tr>
            <tr>
                <td class="label">Rencana Pengujian</td>
                <td>{{ $testPlan }}</td>
            </tr>
            <tr>
                <td class="label">Dievaluasi Oleh</td>
                <td>{{ $evaluatorName }}<br>NIP. {{ $evaluatorNip }} — {{ $evaluatorPosition }}</td>
            </tr>
        </table>
    </div>

    {{-- TINJAUAN PERUBAHAN --}}
    <div class="section">
        <div class="section-title">Tinjauan Perubahan</div>
        <table class="info-table">
            <tr>
                <td class="label">Status Permintaan</td>
                <td>
                    @if($reviewStatus === 'diterima')
                        <span class="status-box status-active">DITERIMA</span>
                    @elseif($reviewStatus === 'ditolak')
                        <span class="status-box">DITOLAK</span>
                    @else
                        <span class="status-box">{{ strtoupper($reviewStatus) }}</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td class="label">Tanggapan</td>
                <td>{{ $reviewResponse }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal Pelaksanaan</td>
                <td>{{ $executionDate }}</td>
            </tr>
            <tr>
                <td class="label">Penanggungjawab Pelaksana Perubahan</td>
                <td>{{ $responsibleTeamName }}</td>
            </tr>
            <tr>
                <td class="label">Ditinjau Oleh</td>
                <td>{{ $reviewerName }}<br>NIP. {{ $reviewerNip }} — {{ $reviewerPosition }}</td>
            </tr>
        </table>
    </div>

    {{-- IMPLEMENTASI PERUBAHAN --}}
    <div class="section">
        <div class="section-title">Implementasi Perubahan</div>
        <table class="info-table">
            <tr>
                <td class="label">Hasil Tanggapan Perubahan</td>
                <td>{{ $implementationResult }}</td>
            </tr>
            <tr>
                <td class="label">Hasil Pengujian Implementasi</td>
                <td>
                    @forelse($attachmentImages as $image)
                        <img src="{{ $image }}" alt="hasil pengujian" style="max-width: 100%; margin-bottom: 6px;">
                    @empty
                        -
                    @endforelse
                </td>
            </tr>
            <tr>
                <td class="label">Tanggal Rilis</td>
                <td>{{ $releaseDate }}</td>
            </tr>
        </table>
    </div>

    <div class="legal">
        Sesuai dengan ketentuan perundang-undangan yang berlaku, surat ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik Badan Siber dan Sandi Negara (BSrE-BSSN).
    </div>

    {{-- TANDA TANGAN --}}
    <div class="signature-block">
        <table class="sig-table">
            <tr>
                <td>
                    <div class="sig-role">Dievaluasi Oleh</div>
                    <div class="sig-box"><img src="{{ $evaluatorSig }}" alt="sig"></div>
                    <div class="sig-name">{{ $evaluatorName }}</div>
                    <div class="sig-nip">NIP. {{ $evaluatorNip }}</div>
                </td>
                <td>
                    <div class="sig-role">Ditinjau Oleh</div>
                    <div class="sig-box"><img src="{{ $reviewerSig }}" alt="sig"></div>
                    <div class="sig-name">{{ $reviewerName }}</div>
                    <div class="sig-nip">NIP. {{ $reviewerNip }}</div>
                </td>
                <td>
                    <div class="sig-role">Penanggungjawab</div>
                    <div class="sig-box"><img src="{{ $responsibleSig }}" alt="sig"></div>
                    <div class="sig-name">{{ $responsibleName }}</div>
                    <div class="sig-nip">NIP. {{ $responsibleNip }}</div>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
