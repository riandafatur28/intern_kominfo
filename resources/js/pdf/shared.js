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
    .sig-space { height: 78px; }
    .sig { display: block; max-width: 160px; max-height: 78px; object-fit: contain; margin: 2px auto; }
    .ttd .name { font-weight: bold; text-decoration: underline; margin-top: 2px; }

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
export function wrapDocument(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${DOC_STYLES}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
