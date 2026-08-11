@php include resource_path('views/pdf/_helpers.php'); @endphp
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Tim WFH</title>
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
    margin: 0;
    background: #fff;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

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
    margin: 6pt 0 10pt 0;
  }

  /* ===== TITLE ===== */
  .judul {
    text-align: center;
    font-size: 12pt;
    letter-spacing: 0.3px;
    margin: 0 0 6pt 0;
    text-transform: uppercase;
  }

  /* Judul halaman 1 laporan tim: selalu satu baris (ukuran sama dgn halaman 2) */
  .judul-satu-baris {
    white-space: nowrap;
  }
  .subjudul {
    text-align: center;
    font-size: 10.5pt;
    margin: 0 0 16pt 0;
  }

  /* ===== INFO BLOCK (page 1) ===== */
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

  /* ===== TABLES ===== */
  table.data {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 10pt;
  }
  table.data th, table.data td {
    border: 1pt solid #000;
    padding: 4pt 6pt;
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
  table.data td.nama, table.data td.link {
    text-align: left;
  }
  table.data td.nama {
    white-space: nowrap;
  }
  table.data td.link {
    word-break: break-all;
    overflow-wrap: break-word;
  }
  table.data td.link a {
    color: #0b57d0;
    text-decoration: underline;
    word-break: break-all;
    overflow-wrap: break-word;
  }

  col.nama-p1 { width: 42%; }
  col.link { width: 54%; }
  col.no { width: 10pt; }

  col.nama-p2 { width: 120pt; }
  col.sesi { width: 15%; }

  table.data td.no, table.data th.no {
    text-align: center;
    padding: 4pt 2pt;
    white-space: nowrap;
    width: 10pt;
  }
  table.data th.no {
    width: 10pt;
  }
  table.data td.nama {
    white-space: nowrap;
  }
  table.data td.nama-wrap {
    text-align: left;
    word-break: break-word;
  }

  .foto-pagi {
    width: 72pt;
    height: auto;
    display: block;
    margin: 0 auto;
  }

  /* ===== FOOTER / TTD ===== */
  .footer-wrap {
    margin-top: 16pt;
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
    $sessionNames = array_keys($sessions);
    $ttdMaker = ucwords(strtolower($makerName));
    $ttdAtasan = ucwords(strtolower($supervisorName));

    // Pembuat laporan = user yang membuat laporan tim (created_by), bukan
    // yang mengekspor PDF. Fallback ke $makerName kalau tanpa team_report_id.
    $trId = request('team_report_id');
    $creator = $trId ? \App\Domains\Wfh\Models\WfhTeamReport::find($trId)?->creator : null;
    if ($creator) {
        $ttdMaker = ucwords(strtolower($creator->name));
        $makerNip = $creator->nip;
        if ($creator->signature_path) {
            $sig = public_path('storage/'.$creator->signature_path);
            if (file_exists($sig)) {
                $signatureMakerPath = $sig;
            }
        }
    }

    // Tanggal Indonesia dari request('date') — controller mengirim string
    // ISO UTC ("2026-07-30T17:00:00.000000Z") atau tanggal murni ("2026-07-31").
    // Parse ulang: string UTC → konversi WIB, tanggal murni → apa adanya.
    $dateRaw = request('date');
    $dateParsed = $dateRaw ? \Illuminate\Support\Carbon::parse($dateRaw) : null;
    if ($dateParsed && (str_contains($dateRaw, 'T') || str_contains($dateRaw, 'Z'))) {
        $dateParsed = $dateParsed->timezone('Asia/Jakarta');
    }
    $tanggalPelaksanaan = $dateParsed
        ? $dateParsed->locale('id')->isoFormat('D MMMM Y')
        : $tanggalPelaksanaan;
@endphp

<!-- ============================================================ -->
<!-- HALAMAN 1 - LAPORAN PELAKSANAAN TUGAS WFH (LINK BUKTI KERJA)  -->
<!-- ============================================================ -->
<div class="page">

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

  <p class="judul judul-satu-baris">Laporan Pelaksanaan Tugas <i>Work From Home</i> (WFH) - {{ $namaTim }}</p>

  <br>

  <table class="info">
    <tr>
      <td class="label">Nama Tim Kerja</td>
      <td class="titik">:</td>
      <td>{{ $namaTim }}</td>
    </tr>
    <tr>
      <td class="label">Unit Kerja</td>
      <td class="titik">:</td>
      <td>{{ $unitKerja }}</td>
    </tr>
    <tr>
      <td class="label">Tanggal Pelaksanaan</td>
      <td class="titik">:</td>
      <td>{{ $tanggalPelaksanaan }}</td>
    </tr>
  </table>

  <table class="data">
    <colgroup>
      <col class="no">
      <col class="nama-p1">
      <col class="link">
    </colgroup>
    <thead>
      <tr>
        <th class="no">No</th>
        <th>Nama Pegawai</th>
        <th>Link Bukti Kerja</th>
      </tr>
    </thead>
    <tbody>
      @foreach($staff as $i => $member)
        @php $links = array_values(array_filter($member['links'] ?? [])); @endphp
        <tr>
          <td class="no">{{ $i + 1 }}.</td>
          <td class="nama">{{ $member['name'] }}</td>
          <td class="link">
            @forelse($links as $link)
              <a class="link-biru" href="{{ $link }}">{{ $link }}</a>@if (!$loop->last)<br><br>@endif
            @empty
              -
            @endforelse
          </td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <div class="footer-wrap">
    <p class="tanggal-kanan">Surabaya, {{ $tanggalPelaksanaan }}</p>
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

<!-- ============================================================ -->
<!-- HALAMAN 2 - LAPORAN BUKTI ABSENSI (SESI PAGI/SIANG/SORE)      -->
<!-- ============================================================ -->
<div class="page">

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

  <p class="judul">Laporan Bukti Absensi <i>Work From Home</i> - {{ $namaTim }}</p>
  <p class="subjudul">{{ $unitKerja }} &bull; {{ $tanggalPelaksanaan }}</p>

  <table class="data">
    <colgroup>
      <col class="no">
      <col class="nama-p2">
      @foreach($sessionNames as $s)
        <col class="sesi">
      @endforeach
    </colgroup>
    <thead>
      <tr>
        <th class="no" rowspan="2">No</th>
        <th rowspan="2">Nama</th>
        <th colspan="{{ count($sessionNames) }}">Sesi</th>
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
          <td class="no">{{ $i + 1 }}.</td>
          <td class="nama-wrap">{{ $member['name'] }}</td>
          @foreach($sessionNames as $s)
            @php
              $photo = $sessions[$s][$i]['photo'] ?? null;
              $photoSrc = wfh_pdf_photo_src($photo);
            @endphp
            <td>
              @if ($photoSrc)
                <img class="foto-pagi" src="{{ $photoSrc }}" alt="Foto absensi {{ $s }}">
              @else
                Belum diisi
              @endif
            </td>
          @endforeach
        </tr>
      @endforeach
    </tbody>
  </table>

  <div class="footer-wrap">
    <p class="tanggal-kanan">Surabaya, {{ $tanggalPelaksanaan }}</p>
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
