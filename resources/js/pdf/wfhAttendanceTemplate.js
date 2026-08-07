import { escapeHtml } from './printDocument';
import { kopHtml, wrapDocument } from './shared';

/**
 * Bagian isi (satu halaman) Laporan Foto Absensi WFH — tanpa <html>/<style>.
 * @param {Object} data
 * @param {string} [data.judul="Laporan Bukti Absensi WFH"]
 * @param {string} [data.tanggal]
 * @param {string} [data.unitKerja]
 * @param {Array<{no?:number, nama:string, pagi?:string, siang?:string, sore?:string}>} data.rows
 * @param {string} [data.logoUrl="/images/logo-jatim.png"]
 * @param {string} [data.makerName]
 * @param {string} [data.makerNip]
 * @param {string} [data.makerSignatureUrl]
 * @param {string} [data.supervisorName="-"]
 * @param {string} [data.supervisorNip="-"]
 * @param {string} [data.supervisorSignatureUrl]
 * @param {string} [data.city="Surabaya"]
 */
export function wfhAttendanceBody(data) {
    const {
        judul = 'Laporan Bukti Absensi WFH',
        tanggal,
        unitKerja,
        rows = [],
        logoUrl = '/images/logo-jatim.png',
        makerName, makerNip, makerSignatureUrl,
        supervisorName = '-', supervisorNip = '-', supervisorSignatureUrl,
        city = 'Surabaya',
    } = data;

    const cell = (url) => (url
        ? `<img class="photo" src="${escapeHtml(url)}" alt="foto" />`
        : '<span class="muted">Belum diisi</span>');

    const body = rows.map((r, i) => `
        <tr>
            <td class="c">${escapeHtml(r.no ?? i + 1)}</td>
            <td>${escapeHtml(r.nama)}</td>
            <td class="c">${cell(r.pagi)}</td>
            <td class="c">${cell(r.siang)}</td>
            <td class="c">${cell(r.sore)}</td>
        </tr>`).join('');

    const subInfo = [
        unitKerja ? `Unit Kerja: ${escapeHtml(unitKerja)}` : '',
        tanggal ? `Tanggal: ${escapeHtml(tanggal)}` : '',
    ].filter(Boolean).join(' &bull; ');

    const makerSig = makerSignatureUrl
        ? `<img class="sig" src="${escapeHtml(makerSignatureUrl)}" alt="ttd" />`
        : '<div class="sig-space"></div>';
    const supSig = supervisorSignatureUrl
        ? `<img class="sig" src="${escapeHtml(supervisorSignatureUrl)}" alt="ttd" />`
        : '<div class="sig-space"></div>';

    return `
    <div class="page">
        ${kopHtml(logoUrl, true)}

        <h1 class="title">${escapeHtml(judul)}</h1>
        ${subInfo ? `<div class="sub">${subInfo}</div>` : '<div style="height:8px"></div>'}

        <table class="grid">
            <thead>
                <tr>
                    <th rowspan="2" style="width:6%">No</th>
                    <th rowspan="2" style="width:22%">Nama</th>
                    <th colspan="3">Sesi</th>
                </tr>
                <tr>
                    <th style="width:24%">Pagi</th>
                    <th style="width:24%">Siang</th>
                    <th style="width:24%">Sore</th>
                </tr>
            </thead>
            <tbody>
                ${body || '<tr><td colspan="5" class="c muted">Belum ada data absensi.</td></tr>'}
            </tbody>
        </table>

        <div class="spacer"></div>

        <div class="ttd">
            <div class="col">
                <div class="place">&nbsp;</div>
                <div>Yang Membuat Laporan</div>
                ${makerSig}
                <div class="name">${escapeHtml(makerName || '-')}</div>
                <div>${escapeHtml(makerNip || '-')}</div>
            </div>
            <div class="col">
                <div class="place">${escapeHtml(city)}${tanggal ? ', ' + escapeHtml(tanggal) : ''}</div>
                <div>Atasan Langsung</div>
                ${supSig}
                <div class="name">${escapeHtml(supervisorName)}</div>
                <div>NIP. ${escapeHtml(supervisorNip)}</div>
            </div>
        </div>
    </div>`;
}

/** Dokumen PDF laporan foto absensi (berdiri sendiri). */
export function wfhAttendanceHtml(data) {
    return wrapDocument(data?.judul || 'Laporan Bukti Absensi WFH', wfhAttendanceBody(data));
}
