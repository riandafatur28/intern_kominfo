import { escapeHtml } from './printDocument';

/** Disclaimer BSrE (footer laporan). */
export const DISCLAIMER = 'Sesuai dengan ketentuan perundang-undangan yang berlaku, surat ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik Badan Siber dan Sandi Negara (BSrE-BSSN). Legalitas berkas secara digital diatur oleh Dinas Komunikasi dan Informatika Provinsi Jawa Timur. Untuk mengetahui keabsahan berkas dapat dilakukan dengan memindai qrcode yang tersedia.';

/** Style dokumen bersama (dipakai laporan kegiatan & laporan foto absensi). */
export const DOC_STYLES = `
    @page { size: A4; margin: 15mm 18mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 11pt; line-height: 1.4; }
    .page { display: block; }
    .page + .page { page-break-before: always; }
    .spacer { height: 48px; }
    .ttd { page-break-inside: avoid; }

    .kop { display: flex; align-items: center; gap: 16px; border-bottom: 3px double #000; padding-bottom: 6px; }
    .kop img { width: 66px; height: auto; }
    .kop .txt { text-align: center; flex: 1; line-height: 1.3; }
    .kop .txt .prov { font-size: 13pt; letter-spacing: .2px; }
    .kop .txt .dinas { font-size: 18pt; font-weight: bold; letter-spacing: .3px; }
    .kop .txt .addr { font-size: 8pt; margin-top: 3px; line-height: 1.3; }

    h1.title { text-align: center; font-size: 12.5pt; font-weight: bold; margin: 22px 0 18px; text-transform: uppercase; }
    .sub { text-align: center; font-size: 10pt; color: #333; margin-bottom: 16px; }

    table.info { border-collapse: collapse; margin-bottom: 16px; font-size: 11pt; }
    table.info td { padding: 2px 0; vertical-align: top; }
    table.info td.k { width: 170px; }
    table.info td.s { width: 16px; }

    table.grid { width: 100%; border-collapse: collapse; }
    table.grid th, table.grid td { border: 1px solid #000; padding: 7px 9px; font-size: 10.5pt; vertical-align: top; }
    table.grid th { text-align: center; font-weight: bold; }
    td.c { text-align: center; vertical-align: middle; }
    .nowrap { white-space: nowrap; }
    .muted { color: #777; }
    .link a { color: #1a56db; word-break: break-all; text-decoration: underline; font-size: 8.5pt; line-height: 1.5; }
    .lgap { height: 6px; }
    .photo { display: block; margin: 4px auto; width: auto; height: auto; max-width: 130px; max-height: 165px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 3px; }

    .ttd { display: flex; justify-content: space-between; margin-top: 10px; }
    .ttd .col { width: 46%; text-align: center; font-size: 11pt; }
    .ttd .place { min-height: 20px; margin-bottom: 2px; }
    .sig-space { height: 80px; }
    .sig { display: block; width: auto; max-width: 160px; height: 78px; object-fit: contain; margin: 2px auto 0; }
    .ttd .name { font-weight: bold; text-decoration: underline; margin-top: 7px; }

    .footer { margin-top: 22px; display: flex; align-items: center; gap: 12px; border-top: 1px solid #999; padding-top: 8px; }
    .footer img.bsre { width: 56px; height: auto; }
    .footer .note { font-size: 7.5pt; color: #333; line-height: 1.4; text-align: justify; flex: 1; }
    .qr { width: 78px; height: 78px; }
`;

/** Kop surat Dinas Kominfo Jatim (dengan alamat). */
export function kopHtml(logoUrl = '/images/logo-jatim.png', withAddress = true) {
    return `
        <div class="kop">
            <img src="${escapeHtml(logoUrl)}" alt="Logo" />
            <div class="txt">
                <div class="prov">PEMERINTAH PROVINSI JAWA TIMUR</div>
                <div class="dinas">DINAS KOMUNIKASI DAN INFORMATIKA</div>
                ${withAddress ? `<div class="addr">Jalan Ahmad Yani Nomor 242-244, Gayungan, Surabaya, Jawa Timur 60235<br/>
                Tlp. (031) 8294608, Fak. (031) 8294517, Laman kominfo.jatimprov.go.id, Pos-el kominfo@jatimprov.go.id</div>` : ''}
            </div>
        </div>`;
}

/** Bungkus body menjadi dokumen HTML lengkap siap cetak. */
export function wrapDocument(title, bodyHtml, styles = DOC_STYLES) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${styles}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/** Teks legal singkat (footer dokumen perubahan) — sesuai contoh formulir. */
export const CHANGE_LEGAL = 'Sesuai dengan ketentuan perundang-undangan yang berlaku, surat ini telah ditandatangani secara elektronik yang tersertifikasi oleh Balai Sertifikasi Elektronik Badan Siber Sandi Negara (BSrE-BSSN) sehingga tidak diperlukan tanda tangan dan stempel basah.';

/**
 * Style dokumen Manajemen Perubahan (Formulir Inisiasi & Persetujuan/Implementasi).
 * Meniru tata letak formulir resmi: kop tabel berbingkai + tabel isian bergaris.
 */
export const CHANGE_DOC_STYLES = `
    @page { size: A4; margin: 14mm 16mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 11pt; line-height: 1.45; }
    .page { display: block; }
    .page + .page { page-break-before: always; }

    /* Kop tabel berbingkai */
    table.ckop { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    table.ckop td { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; }
    table.ckop td.logo { width: 96px; text-align: center; }
    table.ckop td.logo img { width: 62px; height: auto; }
    table.ckop td.title { text-align: center; font-weight: bold; font-size: 13.5pt; letter-spacing: .2px; }
    table.ckop td.klabel { width: 66px; font-size: 10.5pt; }
    table.ckop td.kval { font-size: 10.5pt; min-width: 150px; }

    .sec { font-weight: bold; text-transform: uppercase; font-size: 11pt; margin: 16px 0 8px; page-break-after: avoid; break-after: avoid; }
    table.form tr { page-break-inside: avoid; break-inside: avoid; }
    .meta { margin: 4px 0 12px; font-size: 10.5pt; }
    .meta div { display: flex; }
    .meta .mk { width: 74px; }
    .meta .ms { width: 12px; }
    .meta .mv { border-bottom: 1px dotted #666; flex: 1; min-height: 15px; }

    table.frow { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10.5pt; }
    table.frow td { padding: 2px 0; vertical-align: top; }
    table.frow td.fk { width: 210px; font-weight: normal; }
    table.frow td.fs { width: 12px; }

    /* Tabel isian utama — table-layout fixed + colgroup agar semua garis sejajar */
    table.form { width: 100%; border-collapse: collapse; font-size: 10.5pt; table-layout: fixed; }
    table.form td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; word-wrap: break-word; overflow-wrap: anywhere; }
    table.form td.label { font-weight: normal; }
    table.form td.chk { text-align: center; font-weight: bold; }
    table.form td.min { height: 48px; }
    .box-min { min-height: 60px; }
    .img-wrap { text-align: center; }
    .img-wrap img { max-width: 100%; max-height: 340px; object-fit: contain; border: 1px solid #ddd; }

    /* Blok tanda tangan dalam sel */
    .sigcell .role { margin-bottom: 2px; }
    .sig-space { height: 64px; }
    .sig { display: block; max-width: 150px; max-height: 64px; object-fit: contain; margin: 2px auto; }
    .signame { font-weight: bold; text-decoration: underline; }

    /* Blok tanda tangan mengalir (inisiasi) */
    .ttd-flow { margin-top: 40px; width: 300px; margin-left: auto; text-align: center; page-break-inside: avoid; }
    .ttd-flow .role { line-height: 1.35; }
    .ttd-flow .sig-space { height: 72px; }
    .ttd-flow .sig { max-height: 72px; }

    .legal { margin-top: 26px; display: flex; align-items: center; gap: 12px; border-top: 0; padding-top: 8px; page-break-inside: avoid; }
    .legal .note { font-size: 7.5pt; color: #333; line-height: 1.4; text-align: justify; flex: 1; }
    .legal img.bsre { width: 70px; height: auto; }
`;

/** Kop tabel formulir perubahan: logo + judul + No/Tanggal/Halaman. */
export function changeKopHtml({ title, docNumber = '', tanggal = '', halaman = '', logoUrl = '/images/logo-jatim.png' } = {}) {
    return `
    <table class="ckop">
        <tr>
            <td class="logo" rowspan="3"><img src="${escapeHtml(logoUrl)}" alt="Logo" /></td>
            <td class="title" rowspan="3">${escapeHtml(title)}</td>
            <td class="klabel">No.</td>
            <td class="kval">${escapeHtml(docNumber)}</td>
        </tr>
        <tr><td class="klabel">Tanggal</td><td class="kval">${escapeHtml(tanggal)}</td></tr>
        <tr><td class="klabel">Halaman</td><td class="kval">${escapeHtml(halaman)}</td></tr>
    </table>`;
}
