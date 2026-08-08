<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 40px; size: A4; }
        * { box-sizing: border-box; }
        body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 10px; color: #000; line-height: 1.4; margin: 0; padding: 0; }

        /* ===== Header table: logo+title cell (rowspan) + No./Tanggal/Halaman ===== */
        .doc-header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .doc-header-table td { border: 1px solid #000; padding: 6px 10px; vertical-align: middle; }
        .kop-cell { width: 62%; }
        .kop-inner { width: 100%; border-collapse: collapse; }
        .kop-inner td { border: none; padding: 0; }
        .kop-logo { width: 55px; text-align: center; vertical-align: middle; }
        .kop-logo img { width: 42px; height: auto; }
        .kop-title { font-weight: bold; font-size: 13px; text-transform: uppercase; text-align: center; }
        .meta-label { width: 70px; font-weight: bold; }
        .meta-value { width: auto; }

        .kv-table { width: 100%; border-collapse: collapse; margin: 2px 0 12px; }
        .kv-table td { padding: 2px 0; vertical-align: top; }
        .kv-label { width: 160px; }
        .kv-sep { width: 12px; }
        .kv-divider { border: none; border-top: 1px dashed #999; margin: 8px 0 12px; }

        .section { margin-bottom: 14px; }
        .section-title { font-weight: bold; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #999; padding-bottom: 2px; margin-bottom: 6px; }

        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { border: 1px solid #000; padding: 5px 7px; vertical-align: top; }
        .info-table td.label { font-weight: bold; background-color: #f0f0f0; width: 150px; }
        .info-table td.sig-cell { width: 150px; text-align: center; }

        /* ── checkbox-style grids (Tipe Perubahan / Prioritas / Dampak / Status) ── */
        .chk-grid { width: 100%; border-collapse: collapse; }
        .chk-grid td { border: none; padding: 2px 0; vertical-align: middle; }
        .chk-mark { width: 16px; }
        .chk-box { display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 10px; font-weight: bold; font-size: 9px; }
        .chk-label { padding-right: 20px; padding-left: 5px; }

        .strike { text-decoration: line-through; color: #999; }

        /* ── signer rows (Dievaluasi Oleh / Ditinjau Oleh / Penanggungjawab) ── */
        .signer-info p { margin: 0; padding: 1px 0; }
        /* KODE BARU */
        .sig-box { height: 50px; margin: 5px auto 0; text-align: center; }
        .sig-box img { max-height: 50px; width: auto; }
        .sig-name { font-weight: bold; text-decoration: underline; padding-top: 2px; font-size: 10px; }
        .sig-nip { font-size: 9px; }

        .attachment-img { max-width: 100%; margin-bottom: 6px; }

        .legal { font-size: 8px; text-align: justify; line-height: 1.3; margin: 14px 0; color: #333; }
    </style>
    <title>Form Implementasi Perubahan</title>
</head>
<body>

@php
    $typePairs = [['Hardware', 'Network'], ['Software', 'Utilities'], ['Aplikasi', 'Prosedur'], ['Operating System', 'Personil']];
    $selectedTypes = $changeTypeNames ?? [];

    // Prioritas: hanya Normal & Emergency
    $priorityOptions = [
        'normal'    => 'Normal',
        'emergency' => 'Emergency'
    ];

    // Dampak: hanya Minor & Mayor
    $impactOptions = [
        'minor' => 'Minor',
        'mayor' => 'Mayor'
    ];
@endphp

    <table class="doc-header-table">
        <tr>
            <td class="kop-cell" rowspan="3">
                <table class="kop-inner">
                    <tr>
                        <td class="kop-logo"><img src="{{ public_path('images/logo-jatim.png') }}" alt="Logo"></td>
                        <td class="kop-title">Formulir Persetujuan Perubahan</td>
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

    <table class="kv-table">
        <tr>
            <td class="kv-label">Berdasarkan Inisiasi Bidang</td>
            <td class="kv-sep">:</td>
            <td>{{ $bidang }}</td>
        </tr>
    </table>
    <table class="kv-table" style="margin-bottom: 4px;">
        <tr><td class="kv-label">Nomor</td><td class="kv-sep">:</td><td>{{ $docNumber }}</td></tr>
        <tr><td class="kv-label">Tanggal</td><td class="kv-sep">:</td><td>{{ $tanggal }}</td></tr>
        <tr><td class="kv-label">Halaman</td><td class="kv-sep">:</td><td>1</td></tr>
    </table>
    <hr class="kv-divider">

    {{-- EVALUASI DAMPAK PERUBAHAN --}}
    <div class="section">
        <div class="section-title">Evaluasi Dampak Perubahan</div>
        <table class="info-table">
            <tr>
                <td class="label">Tipe Perubahan</td>
                <td colspan="2">
                    <table class="chk-grid">
                        @foreach($typePairs as [$left, $right])
                            <tr>
                                <td class="chk-mark"><span class="chk-box">{{ in_array($left, $selectedTypes, true) ? 'v' : '' }}</span></td>
                                <td class="chk-label">{{ $left }}</td>
                                <td class="chk-mark"><span class="chk-box">{{ in_array($right, $selectedTypes, true) ? 'v' : '' }}</span></td>
                                <td>{{ $right }}</td>
                            </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            <tr>
                <td class="label">Prioritas Perubahan</td>
                <td colspan="2">
                    <table class="chk-grid">
                        <tr>
                            @foreach($priorityOptions as $key => $optLabel)
                                <td class="chk-mark">
                                    <span class="chk-box">{{ strtolower($priority ?? '') === strtolower($key) ? 'v' : '' }}</span>
                                </td>
                                <td class="chk-label">{{ $optLabel }}</td>
                            @endforeach
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td class="label">Dampak Perubahan</td>
                <td colspan="2">
                    <table class="chk-grid">
                        <tr>
                            @foreach($impactOptions as $key => $optLabel)
                                <td class="chk-mark">
                                    <span class="chk-box">{{ strtolower($impact ?? '') === strtolower($key) ? 'v' : '' }}</span>
                                </td>
                                <td class="chk-label">{{ $optLabel }}</td>
                            @endforeach
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td class="label">Dampak Terhadap Lingkungan Produksi</td>
                <td colspan="2">{{ $productionImpact }}</td>
            </tr>
            <tr>
                <td class="label">Upaya / Tindakan yang diperlukan</td>
                <td colspan="2">{{ $requiredEffort }}</td>
            </tr>
            <tr>
                <td class="label">Kebutuhan Biaya</td>
                <td colspan="2">
                    <span class="{{ $costNeeded === 'Ada' ? '' : 'strike' }}">Ada</span> /
                    <span class="{{ $costNeeded === 'Tidak' ? '' : 'strike' }}">Tidak</span>
                    &nbsp;&nbsp;Jumlah : {{ $costAmount }}
                </td>
            </tr>
            <tr>
                <td class="label">Kebutuhan Sumber Daya (Personil, H/W, S/W)</td>
                <td colspan="2">{{ $resources }}</td>
            </tr>
            <tr>
                <td class="label">Penjelasan Rencana Pengujian</td>
                <td colspan="2">{{ $testPlan }}</td>
            </tr>
            <tr>
                <td class="label">Dievaluasi Oleh</td>
                <td class="signer-info">
                    <p>Nama&nbsp;&nbsp;: {{ $evaluatorName }}</p>
                    <p>Bidang : {{ $evaluatorBidang }}</p>
                    <p>Jabatan: {{ $evaluatorPosition }}</p>
                </td>
                <td class="sig-cell">
                    Tanda Tangan
                    <div class="sig-box"><img src="{{ $evaluatorSig }}" alt="ttd"></div>
                </td>
            </tr>
        </table>
    </div>

    {{-- TINJAUAN PERUBAHAN --}}
    <div class="section">
        <div class="section-title">Tinjauan Perubahan</div>
        <table class="info-table">
            <tr>
                <td class="label">Status Permintaan Perubahan</td>
                <td colspan="2">
                    <table class="chk-grid">
                        <tr>
                            <td class="chk-mark"><span class="chk-box">{{ strtolower($reviewStatus ?? '') === 'diterima' ? 'v' : '' }}</span></td>
                            <td class="chk-label">DITERIMA</td>
                            <td class="chk-mark"><span class="chk-box">{{ strtolower($reviewStatus ?? '') === 'ditolak' ? 'v' : '' }}</span></td>
                            <td>DITOLAK</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td class="label">Tanggapan</td>
                <td colspan="2">{{ $reviewResponse }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal Pelaksanaan Perubahan</td>
                <td colspan="2">{{ $executionDate }}</td>
            </tr>
            <tr>
                <td class="label">Penanggungjawab Pelaksana Perubahan</td>
                <td colspan="2">{{ $responsibleTeamName }}</td>
            </tr>
            <tr>
                <td class="label">Ditinjau Oleh</td>
                <td class="signer-info">
                    <p>Nama&nbsp;&nbsp;: {{ $reviewerName }}</p>
                    <p>Bidang : {{ $reviewerBidang }}</p>
                    <p>Jabatan: {{ $reviewerPosition }}</p>
                </td>
                <td class="sig-cell">
                    Tanda Tangan
                    <div class="sig-box"><img src="{{ $reviewerSig }}" alt="ttd"></div>
                </td>
            </tr>
        </table>
    </div>

    {{-- IMPLEMENTASI PERUBAHAN --}}
    <div class="section">
        <div class="section-title">Implementasi Perubahan</div>
        <table class="info-table">
            <tr>
                <td class="label">Hasil Tanggapan Perubahan</td>
                <td colspan="2">{{ $implementationResult }}</td>
            </tr>
            <tr>
                <td class="label">Hasil Pengujian Implementasi</td>
                <td colspan="2">
                    @forelse($attachmentImages as $image)
                        <img src="{{ $image }}" alt="hasil pengujian" class="attachment-img">
                    @empty
                        -
                    @endforelse
                </td>
            </tr>
            <tr>
                <td class="label">Tanggal Rilis</td>
                <td colspan="2">{{ $releaseDate }}</td>
            </tr>
            <tr>
                <td class="label">Penanggungjawab Pelaksana Perubahan</td>
                <td class="signer-info">
                    <p>Nama&nbsp;&nbsp;: {{ $responsibleName }}</p>
                    <p>Bidang : {{ $responsibleBidang }}</p>
                    <p>Jabatan: {{ $responsiblePosition }}</p>
                </td>
                <td class="sig-cell">
                    Tanda Tangan
                    <div class="sig-box"><img src="{{ $responsibleSig }}" alt="ttd"></div>
                </td>
            </tr>
        </table>
    </div>

    <div class="legal">
        Sesuai dengan ketentuan perundang-undangan yang berlaku, surat ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik Badan Siber dan Sandi Negara (BSrE-BSSN).
    </div>

</body>
</html>