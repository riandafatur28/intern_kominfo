@php include resource_path('views/pdf/_helpers.php'); @endphp
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Pelaksanaan Tugas WFH</title>
<style>
  @page { size: letter; margin: 30pt 55pt 35pt 55pt; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  .page {
    width: auto;
    min-height: 0;
    margin: 0;
    padding: 0;
    background: #fff;
  }

  /* ===== HEADER / KOP SURAT ===== */
  .kop {
    display: table;
    width: 100%;
    margin-bottom: 6pt;
  }
  .kop-logo {
    display: table-cell;
    width: 70pt;
    vertical-align: middle;
    text-align: center;
  }
  .kop-logo img {
    width: 45pt;
    height: auto;
  }
  .kop-text {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
  }
  .kop-text .instansi1 {
    font-size: 12pt;
    letter-spacing: 0.2px;
    margin: 0;
  }
  .kop-text .instansi2 {
    font-size: 18pt;
    font-weight: 700;
    margin: 1pt 0 3pt 0;
  }
  .kop-text .alamat {
    font-size: 8pt;
    margin: 0;
  }
  .kop-text .kontak {
    font-size: 8pt;
    margin: 0;
  }
  .kop-divider {
    border: none;
    border-top: 2.5pt solid #000;
    margin: 6pt 0 18pt 0;
  }

  /* ===== TITLE ===== */
  .judul {
    text-align: center;
    font-size: 12pt;
    letter-spacing: 0.3px;
    margin: 0 0 16pt 0;
    text-transform: uppercase;
  }

  /* ===== INFO BLOCK ===== */
  table.info {
    font-size: 10.5pt;
    border-collapse: collapse;
    margin-bottom: 14pt;
  }
  table.info td {
    padding: 2pt 0;
    vertical-align: top;
  }
  table.info td.label { width: 118pt; }
  table.info td.titik { width: 14pt; }

  /* ===== TABLE (KEGIATAN) ===== */
  table.data {
    width: 100%;
    /* table-layout: fixed; */
    border-collapse: collapse;
    font-size: 10pt;
  }
  table.data th, table.data td {
    border: 1pt solid #000;
    padding: 7pt 8pt;
  }
  table.data th {
    font-weight: normal;
    text-align: center;
    vertical-align: middle;
  }
  table.data td {
    text-align: center;
    vertical-align: middle;
  }
  table.data td.link {
    text-align: left;
    width: 180pt;
    word-break: break-all;
    overflow-wrap: break-word;
  }
  table.data td.link a {
    color: #0b57d0;
    text-decoration: underline;
    word-break: break-all;
    overflow-wrap: break-word;
  }
  table.data td.kegiatan {
    width: 153pt;
    text-align: left;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  table.data td.waktu {
    width: 90pt;
  }

  col.no { width: 24pt; }
  col.waktu { width: 90pt; }
  col.kegiatan { width: 153pt; }
  col.link { width: 180pt; }

  table.data td.no, table.data th.no {
    text-align: center;
    padding: 7pt 2pt;
    white-space: nowrap;
    width: 24pt;
  }
  table.data th.no {
    width: 24pt;
  }
  table.data td.waktu {
    width: 90pt;
    white-space: nowrap;
  }

  /* ===== FOOTER / TTD ===== */
  .footer-wrap {
    margin-top: 40pt;
  }
  .tanggal-kanan {
    text-align: center;
    font-size: 10.5pt;
    margin-bottom: 0;
    margin-left: 50%;
  }
  table.ttd {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
    margin-top: 0;
  }
  table.ttd td {
    width: 50%;
    text-align: center;
    vertical-align: top;
    padding: 0;
  }
  .ttd-label {
    margin: 0;
    margin-bottom: 16pt;
  }
  .ttd-img {
    width: 120pt;
    height: 36pt;
    display: block;
    margin: 0 auto 4pt;
  }
  .ttd-nama {
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 1pt;
  }
  .ttd-nip {
    margin: 0;
  }
</style>
</head>
<body>

@php
    // Controller mengirim tanggal "30 July 2026" (locale en). Kalau belum
    // berbahasa Indonesia, ubah ke "30 Juli 2026".
    $bulanId = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    $tanggalDisplay = collect($bulanId)->contains(fn ($b) => str_contains($tanggalPelaksanaan, $b))
        ? $tanggalPelaksanaan
        : \Illuminate\Support\Carbon::parse($tanggalPelaksanaan)->locale('id')->isoFormat('D MMMM Y');
    // Atasan langsung = kepala bidang (field head). Controller mengirim supervisor
    // dari report; fallback ke kepala bidang saat report belum punya supervisor.
    // TTD atasan tetap hanya muncul setelah laporan disetujui (dikirim controller).
    if ($supervisorName === '-' || $supervisorNip === '-') {
        $headId = \App\Models\Field::whereNotNull('head_id')->value('head_id');
        $kabid = $headId ? \App\Models\User::find($headId) : null;
        $supervisorName = $kabid?->name ?? '-';
        $supervisorNip = $kabid?->nip ?? '-';
    }
    $ttdMaker = ucwords(strtolower($makerName));
    $ttdAtasan = ucwords(strtolower($supervisorName));
    // Controller kirim waktu "2026-07-31 08:00:00 – 11:00:00" (cast datetime)
    // atau "08:00:00 – 11:00:00" -> tampilkan "08.00 - 11.00".
    $kegiatan = collect($kegiatan)->map(function ($k) {
        try {
            $parts = preg_split('/\s*–\s*/u', $k['waktu']);
            if (count($parts) === 2) {
                $fmt = function ($t) {
                    $t = trim($t);
                    if (preg_match('/(\d{1,2}):(\d{2})/', $t, $m)) {
                        return $m[1].'.'.$m[2];
                    }
                    return $t;
                };
                return array_merge($k, ['waktu' => $fmt($parts[0]).' - '.$fmt($parts[1])]);
            }
        } catch (\Throwable $e) {
        }
        return $k;
    })->all();
@endphp

<div class="page">

  <!-- KOP SURAT -->
  <div class="kop">
    <div class="kop-logo">
      <img src="{{ wfh_pdf_photo_src(public_path('images/logo-jatim.png'), 120) }}" alt="Logo Jawa Timur">
    </div>
    <div class="kop-text">
      <p class="instansi1">PEMERINTAH PROVINSI JAWA TIMUR</p>
      <p class="instansi2">DINAS KOMUNIKASI DAN INFORMATIKA</p>
      <p class="alamat">Jalan Ahmad Yani Nomor 242-244, Gayungan, Surabaya, Jawa Timur 60235</p>
      <p class="kontak">Tlp. (031) 8294608, Fak. (031) 8294517, Laman kominfo.jatimprov.go.id, Pos-el kominfo@jatimprov.go.id</p>
    </div>
  </div>
  <hr class="kop-divider">

  <!-- JUDUL -->
  <p class="judul">Laporan Pelaksanaan Tugas <i>Work From Home</i> (WFH)</p>

  <!-- INFO PEGAWAI -->
  <table class="info">
    <tr>
      <td class="label">Nama</td>
      <td class="titik">:</td>
      <td>{{ $nama }}</td>
    </tr>
    <tr>
      <td class="label">NIP</td>
      <td class="titik">:</td>
      <td>{{ $nip }}</td>
    </tr>
    <tr>
      <td class="label">Pangkat/Gol</td>
      <td class="titik">:</td>
      <td>{{ $pangkat }}</td>
    </tr>
    <tr>
      <td class="label">Jabatan</td>
      <td class="titik">:</td>
      <td>{{ $jabatan }}</td>
    </tr>
    <tr>
      <td class="label">Unit Kerja</td>
      <td class="titik">:</td>
      <td>{{ $unitKerja }}</td>
    </tr>
    <tr>
      <td class="label">Tanggal Pelaksanaan</td>
      <td class="titik">:</td>
      <td>{{ $tanggalDisplay }}</td>
    </tr>
  </table>

  <!-- TABEL KEGIATAN -->
  <table class="data">
    <colgroup>
      <col class="no">
      <col class="waktu">
      <col class="kegiatan">
      <col class="link">
    </colgroup>
    <thead>
      <tr>
        <th class="no" style="width:24pt">No</th>
        <th style="width:90pt">Waktu Pelaksanaan</th>
        <th style="width:153pt">Kegiatan</th>
        <th style="width:180pt">Link Bukti Kerja</th>
      </tr>
    </thead>
    <tbody>
      @forelse($kegiatan as $i => $k)
        <tr>
          <td class="no">{{ $i + 1 }}.</td>
          <td>{{ $k['waktu'] }}</td>
          <td>{{ $k['kegiatan'] }}</td>
          <td class="link">
            @forelse($k['links'] as $link)
              @php $broken = preg_replace('/(.{20})/', '$1<wbr>', e($link)); @endphp
              <a class="link-biru" href="{{ $link }}">{!! $broken !!}</a>@if (!$loop->last)<br><br>@endif
            @empty
              -
            @endforelse
          </td>
        </tr>
      @empty
        <tr>
          <td colspan="4">Belum ada kegiatan</td>
        </tr>
      @endforelse
    </tbody>
  </table>

  <!-- TANDA TANGAN -->
  <div class="footer-wrap">
    <p class="tanggal-kanan">Surabaya, {{ $tanggalDisplay }}</p>
    <table class="ttd">
      <tr>
        <td><p class="ttd-label">Yang Membuat Laporan</p></td>
        <td><p class="ttd-label">Atasan Langsung</p></td>
      </tr>
      <tr>
        <td>
          @if ($signatureMakerPath)
            <img class="ttd-img" src="{{ $signatureMakerPath }}" alt="Tanda tangan">
          @endif
          <p class="ttd-nama">{{ $ttdMaker }}</p>
          <p class="ttd-nip">NIP. {{ $makerNip }}</p>
        </td>
        <td>
          @if ($signatureSupervisorPath)
            <img class="ttd-img" src="{{ $signatureSupervisorPath }}" alt="Tanda tangan">
          @endif
          <p class="ttd-nama">{{ $ttdAtasan }}</p>
          <p class="ttd-nip">NIP. {{ $supervisorNip }}</p>
        </td>
      </tr>
    </table>
  </div>

</div>

</body>
</html>
