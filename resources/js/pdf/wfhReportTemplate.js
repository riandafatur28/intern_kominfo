import { escapeHtml } from './printDocument';
import { kopHtml, wrapDocument } from './shared';

/* ubah YYYY-MM-DD jadi DD-MM-YYYY */
function formatDate(d) {
    if (!d || d === '-') return '-';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
}

/**
 * Bagian isi (satu halaman) Laporan Pelaksanaan Tugas WFH — tanpa <html>/<style>.
 * @param {Object} data - lihat wfhReportHtml
 */
export function wfhReportBody(data) {
    const {
        nama = '-', nip = '-', pangkat = '-', jabatan = '-', unitKerja = '-',
        tanggalPelaksanaan = '-', kegiatan = [], isApproved = false,
        makerName, makerNip, makerSignatureUrl,
        supervisorName = '-', supervisorNip = '-', supervisorSignatureUrl,
        qrImageUrl, city = 'Surabaya',
        logoUrl = '/images/logo-jatim.png', bsreLogoUrl,
    } = data;

    const rows = kegiatan.map((k, i) => {
        const links = (k.links ?? []).filter(Boolean);
        const linkHtml = links.length
            ? links.map((l) => `<a href="${escapeHtml(l)}">${escapeHtml(l)}</a>`).join('<div class="lgap"></div>')
            : '<span class="muted">-</span>';
        return `
            <tr>
                <td class="c">${i + 1}.</td>
                <td class="c nowrap">${escapeHtml(k.waktu)}</td>
                <td>${escapeHtml(k.kegiatan)}</td>
                <td class="link">${linkHtml}</td>
            </tr>`;
    }).join('');

    const makerSig = makerSignatureUrl
        ? `<img class="sig" src="${escapeHtml(makerSignatureUrl)}" alt="ttd" />`
        : '<div class="sig-space"></div>';
    const supSig = isApproved && supervisorSignatureUrl
        ? `<img class="sig" src="${escapeHtml(supervisorSignatureUrl)}" alt="ttd" />`
        : '<div class="sig-space"></div>';
    const qrBlock = isApproved && qrImageUrl
        ? `<img class="qr" src="${escapeHtml(qrImageUrl)}" alt="QR verifikasi" />`
        : '';

    return `
    <div class="page">
        ${kopHtml(logoUrl, true)}

        <h1 class="title">Laporan Pelaksanaan Tugas Work From Home (WFH)</h1>

        <table class="info">
            <tr><td class="k">Nama</td><td class="s">:</td><td>${escapeHtml(nama)}</td></tr>
            <tr><td class="k">NIP</td><td class="s">:</td><td>${escapeHtml(nip)}</td></tr>
            <tr><td class="k">Pangkat/Gol</td><td class="s">:</td><td>${escapeHtml(pangkat)}</td></tr>
            <tr><td class="k">Jabatan</td><td class="s">:</td><td>${escapeHtml(jabatan)}</td></tr>
            <tr><td class="k">Unit Kerja</td><td class="s">:</td><td>${escapeHtml(unitKerja)}</td></tr>
            <tr><td class="k">Tanggal Pelaksanaan</td><td class="s">:</td><td>${escapeHtml(formatDate(tanggalPelaksanaan))}</td></tr>
        </table>

        <table class="grid">
            <thead>
                <tr>
                    <th style="width:6%">No</th>
                    <th style="width:20%">Waktu Pelaksanaan</th>
                    <th style="width:44%">Kegiatan</th>
                    <th style="width:30%">Link Bukti Kerja</th>
                </tr>
            </thead>
            <tbody>
                ${rows || '<tr><td colspan="4" class="c muted">Belum ada kegiatan.</td></tr>'}
            </tbody>
        </table>

        <div class="spacer"></div>

        <div class="ttd">
            <div class="col">
                <div class="place">&nbsp;</div>
                <div>Yang Membuat Laporan</div>
                ${makerSig}
                <div class="name">${escapeHtml(makerName || nama)}</div>
                <div>${escapeHtml(makerNip || nip)}</div>
            </div>
            <div class="col">
                <div class="place">${escapeHtml(city)}, ${escapeHtml(formatDate(tanggalPelaksanaan))}</div>
                <div>Atasan Langsung</div>
                ${supSig}
                <div class="name">${escapeHtml(supervisorName)}</div>
                <div>NIP. ${escapeHtml(supervisorNip)}</div>
            </div>
        </div>

        ${(qrBlock || bsreLogoUrl) ? `<div class="footer">
            ${bsreLogoUrl ? `<img class="bsre" src="${escapeHtml(bsreLogoUrl)}" alt="BSrE" />` : ''}
            ${qrBlock}
        </div>` : ''}
    </div>`;
}

/** Dokumen PDF laporan WFH untuk SATU pegawai. */
export function wfhReportHtml(data) {
    return wrapDocument(`Laporan WFH - ${data?.nama ?? ''}`, wfhReportBody(data));
}

/**
 * Dokumen PDF gabungan: BANYAK laporan kegiatan dalam satu file (satu halaman per orang).
 */
export function wfhReportBatchHtml(list = [], meta = {}) {
    const title = meta.title || `Laporan WFH${meta.tanggal ? ` - ${meta.tanggal}` : ''}`;
    const body = list.length
        ? list.map(wfhReportBody).join('\n')
        : '<div class="page"><p class="muted" style="text-align:center;margin-top:40px">Tidak ada laporan untuk dicetak.</p></div>';
    return wrapDocument(title, body);
}
