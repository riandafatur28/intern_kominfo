<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 40px 50px; size: A4; }
        * { box-sizing: border-box; }
        body {
            font-family: "DejaVu Sans", Arial, sans-serif;
            font-size: 10px;
            color: #000;
            line-height: 1.4;
            margin: 0;
        }

        /* === HEADER TABEL === */
        .doc-header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .doc-header td {
            border: 1px solid #000;
            padding: 4px 8px;
        }
        .doc-header .label {
            background-color: #f0f0f0;
            font-weight: bold;
            width: 60px;
            text-align: center;
        }
        .doc-title {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            background-color: #e0e0e0;
        }

        h3.section {
            background-color: #d0d0d0;
            padding: 4px 8px;
            margin: 10px 0 5px 0;
            font-size: 11px;
            text-transform: uppercase;
        }

        /* === EVALUASI TABLE === */
        table.eval {
            width: 100%;
            border-collapse: collapse;
        }
        table.eval td {
            border: 1px solid #000;
            padding: 5px 8px;
            vertical-align: top;
        }
        table.eval td.field-label {
            background-color: #f5f5f5;
            font-weight: bold;
            width: 200px;
        }

        /* === CHECKBOX GRID (M2 CORE TEST) === */
        .checkbox-grid {
            display: flex;
            flex-wrap: wrap;
        }
        .checkbox-item {
            width: 50%;
            padding: 2px 5px;
            white-space: nowrap;
        }
        .check-box {
            font-family: "DejaVu Sans";
            font-size: 14px;
            margin-right: 4px;
        }
        .checked { font-weight: bold; }

        /* === SIGNATURE BLOCK === */
        .sig-block {
            margin-top: 10px;
        }
        table.sig-table {
            width: 100%;
            border-collapse: collapse;
        }
        table.sig-table td {
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
            text-align: center;
        }
        .sig-role {
            font-weight: bold;
            margin-bottom: 40px;
        }
        .sig-image-box {
            position: relative;
            height: 50px;
            margin: 0 auto 3px;
            width: 180px;
        }
        .sig-image-box img {
            position: absolute;
            top: -45px;
            left: 0;
            height: 50px;
            width: auto;
        }
        .sig-name {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 2px;
        }
        .sig-meta {
            font-size: 9px;
            margin-top: 1px;
        }

        .status-row {
            display: flex;
            gap: 30px;
            margin: 5px 0;
        }
        .status-item { font-weight: bold; }

        .legal {
            font-size: 8px;
            text-align: justify;
            line-height: 1.3;
            margin: 8px 0;
            color: #333;
        }
    </style>
    <title>Form Persetujuan Perubahan</title>
</head>
<body>

    {{-- HEADER --}}
    <table class="doc-header">
        <tr>
            <td class="label">No.</td>
            <td>{{ $docNumber }}</td>
            <td class="label">Halaman</td>
            <td>1</td>
        </tr>
        <tr>
            <td colspan="4" class="doc-title">FORMULIR PERSETUJUAN PERUBAHAN</td>
        </tr>
        <tr>
            <td class="label">Tanggal</td>
            <td>{{ $tanggal }}</td>
            <td colspan="2" style="font-size:9px;">Berdasarkan Inisiasi Bidang : {{ $bidang }}</td>
        </tr>
    </table>

    {{-- EVALUASI DAMPAK PERUBAHAN --}}
    <h3 class="section">EVALUASI DAMPAK PERUBAHAN</h3>
    <table class="eval">
        <tr>
            <td class="field-label">Tipe Perubahan</td>
            <td>
                <div class="checkbox-grid">
                    @foreach($allTypes as $type)
                        <div class="checkbox-item">
                            <span class="check-box {{ in_array($type, $selectedTypes) ? 'checked' : '' }}">{{ in_array($type, $selectedTypes) ? '☑' : '☐' }}</span>{{ $type }}
                        </div>
                    @endforeach
                </div>
            </td>
        </tr>
        <tr>
            <td class="field-label">Prioritas Perubahan</td>
            <td>
                @foreach($allPriorities as $p)
                    <span style="margin-right:20px;">
                        <span class="check-box {{ $priority === $p ? 'checked' : '' }}">{{ $priority === $p ? '☑' : '☐' }}</span>{{ $p }}
                    </span>
                @endforeach
            </td>
        </tr>
        <tr>
            <td class="field-label">Dampak Perubahan</td>
            <td>
                @foreach($allImpacts as $im)
                    <span style="margin-right:20px;">
                        <span class="check-box {{ $impact === $im ? 'checked' : '' }}">{{ $impact === $im ? '☑' : '☐' }}</span>{{ $im }}
                    </span>
                @endforeach
            </td>
        </tr>
        <tr>
            <td class="field-label">Dampak Terhadap Lingkungan Produksi</td>
            <td>{{ $productionImpact }}</td>
        </tr>
        <tr>
            <td class="field-label">Upaya / Tindakan yang diperlukan</td>
            <td>{{ $requiredEffort }}</td>
        </tr>
        <tr>
            <td class="field-label">Kebutuhan Biaya</td>
            <td>
                <span class="check-box {{ $costNeeded ? 'checked' : '' }}">{{ $costNeeded ? '☑' : '☐' }}</span>Ada
                <span style="margin-left:20px;" class="check-box {{ !$costNeeded ? 'checked' : '' }}">{{ !$costNeeded ? '☑' : '☐' }}</span>Tidak
                @if($costNeeded)
                    <span style="margin-left:20px;">Jumlah: Rp. {{ number_format($costAmount, 0, ',', '.') }}</span>
                @endif
            </td>
        </tr>
        <tr>
            <td class="field-label">Kebutuhan Sumber Daya<br>(Personil, H/W, S/W)</td>
            <td>{{ $resources }}</td>
        </tr>
        <tr>
            <td class="field-label">Penjelasan Rencana Pengujian</td>
            <td>{{ $testPlan }}</td>
        </tr>
        <tr>
            <td class="field-label">Dievaluasi Oleh</td>
            <td>
                <div style="text-align:center;">
                    <div style="height:40px; position:relative; width:150px; margin:0 auto;">
                        <img src="{{ $evaluatorSigPath }}" style="position:absolute; top:-35px; left:0; height:40px; width:auto;">
                    </div>
                    <div style="border-top:1px solid #000; padding-top:2px;">
                        <strong>{{ $evaluatorName }}</strong><br>
                        <span style="font-size:9px;">Bidang: {{ $evaluatorBidang }}<br>Jabatan: {{ $evaluatorJabatan }}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    {{-- TINJAUAN PERUBAHAN --}}
    <h3 class="section">TINJAUAN PERUBAHAN</h3>
    <table class="eval">
        <tr>
            <td class="field-label">Status Permintaan Perubahan</td>
            <td>
                <div class="status-row">
                    <span class="status-item">
                        <span class="check-box {{ $reviewStatus === 'DITERIMA' ? 'checked' : '' }}">{{ $reviewStatus === 'DITERIMA' ? '☑' : '☐' }}</span>DITERIMA
                    </span>
                    <span class="status-item">
                        <span class="check-box {{ $reviewStatus === 'DITOLAK' ? 'checked' : '' }}">{{ $reviewStatus === 'DITOLAK' ? '☑' : '☐' }}</span>DITOLAK
                    </span>
                </div>
            </td>
        </tr>
        <tr>
            <td class="field-label">Tanggapan</td>
            <td>{{ $reviewResponse ?: '-' }}</td>
        </tr>
        <tr>
            <td class="field-label">Tanggal Pelaksanaan Perubahan</td>
            <td>{{ $executionDate }}</td>
        </tr>
        <tr>
            <td class="field-label">Ditinjau Oleh<br>(Penanggungjawab Pelaksana)</td>
            <td>
                <div style="text-align:center;">
                    <div style="height:40px; position:relative; width:150px; margin:0 auto;">
                        <img src="{{ $reviewerSigPath }}" style="position:absolute; top:-35px; left:0; height:40px; width:auto;">
                    </div>
                    <div style="border-top:1px solid #000; padding-top:2px;">
                        <strong>{{ $reviewerName }}</strong><br>
                        <span style="font-size:9px;">Bidang: {{ $reviewerBidang }}<br>Jabatan: {{ $reviewerJabatan }}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    {{-- IMPLEMENTASI PERUBAHAN --}}
    <h3 class="section">IMPLEMENTASI PERUBAHAN</h3>
    <table class="eval">
        <tr>
            <td class="field-label">Hasil Tanggapan Perubahan</td>
            <td>{{ $implementationResult ?: '-' }}</td>
        </tr>
        <tr>
            <td class="field-label">Hasil Pengujian Implementasi</td>
            <td>{{ $testingResult ?: '-' }}</td>
        </tr>
        <tr>
            <td class="field-label">Tanggal Rilis</td>
            <td>{{ $releaseDate }}</td>
        </tr>
        <tr>
            <td class="field-label">Penanggungjawab Pelaksana Perubahan</td>
            <td>
                <div style="text-align:center;">
                    <div style="height:40px; position:relative; width:150px; margin:0 auto;">
                        <img src="{{ $responsibleSigPath }}" style="position:absolute; top:-35px; left:0; height:40px; width:auto;">
                    </div>
                    <div style="border-top:1px solid #000; padding-top:2px;">
                        <strong>{{ $responsibleName }}</strong><br>
                        <span style="font-size:9px;">Bidang: {{ $responsibleBidang }}<br>Jabatan: {{ $responsibleJabatan }}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="legal">
        Sesuai dengan ketentuan perundang-undangan yang berlaku, surat ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik Badan Siber dan Sandi Negara (BSrE-BSSN). Legalitas berkas secara digital diatur oleh Dinas Komunikasi dan Informatika Provinsi Jawa Timur. Untuk mengetahui keabsahan berkas dapat dilakukan dengan memindai qrcode yang tersedia.
    </div>

    {{-- QR CODE --}}
    <div style="position:fixed; bottom:20px; right:20px; width:50px; height:50px;">
        {!! $qrSvg !!}
    </div>

</body>
</html>
