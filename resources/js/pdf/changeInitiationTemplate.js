import { escapeHtml } from './printDocument';
import { changeKopHtml, wrapDocument, CHANGE_DOC_STYLES } from './shared';

/**
 * Bagian isi (satu halaman) Formulir Inisiasi Perubahan — tanpa <html>/<style>.
 *
 * @param {Object} data
 * @param {string} data.docNumber        - Nomor dokumen (doc_number)
 * @param {string} data.tanggal          - Tanggal dokumen (sudah diformat)
 * @param {string|number} [data.halaman] - Nomor halaman (default 1)
 * @param {string} data.bidang           - Nama bidang
 * @param {string} data.neededByDate     - Hasil perubahan dibutuhkan pada tanggal (diformat)
 * @param {string} data.description       - Deskripsi perubahan
 * @param {string} data.reason            - Alasan perubahan
 * @param {string} data.initiatorName     - Nama inisiator
 * @param {string} data.initiatorNip      - NIP inisiator
 * @param {string} data.initiatorPosition - Jabatan inisiator
 * @param {?string} data.initiatorSignatureUrl - URL tanda tangan (opsional)
 * @param {boolean} [data.isApproved]     - Tampilkan TTD hanya bila sudah disetujui/dikirim
 * @param {?string} [data.bsreLogoUrl]    - Logo BSrE untuk footer (opsional)
 * @param {string} [data.logoUrl]
 */
export function changeInitiationBody(data) {
    const {
        docNumber = '', tanggal = '', halaman = 1,
        bidang = '-', neededByDate = '-', description = '-', reason = '-',
        initiatorName = '-', initiatorNip = '-', initiatorPosition = 'Inisiator Perubahan',
        initiatorSignatureUrl, isApproved = false,
        logoUrl = '/images/logo-jatim.png',
    } = data;

    const sig = isApproved && initiatorSignatureUrl
        ? `<img class="sig" src="${escapeHtml(initiatorSignatureUrl)}" alt="ttd" />`
        : '<div class="sig-space"></div>';

    return `
    <div class="page">
        ${changeKopHtml({ title: 'FORMULIR INISIASI PERUBAHAN', docNumber, tanggal, halaman, logoUrl })}

        <div class="sec">Inisiator Perubahan</div>

        <table class="frow">
            <tr>
                <td class="fk">Bidang</td>
                <td class="fs">:</td>
                <td>${escapeHtml(bidang)}</td>
            </tr>
            <tr>
                <td class="fk">Hasil perubahan dibutuhkan pada tanggal</td>
                <td class="fs">:</td>
                <td>${escapeHtml(neededByDate)}</td>
            </tr>
        </table>

        <table class="frow" style="margin-top:14px">
            <tr>
                <td class="fk">DESKRIPSI PERUBAHAN</td>
                <td class="fs">:</td>
                <td>${escapeHtml(description)}</td>
            </tr>
        </table>
        <table class="frow" style="margin-top:10px">
            <tr>
                <td class="fk">ALASAN PERUBAHAN</td>
                <td class="fs">:</td>
                <td>${escapeHtml(reason)}</td>
            </tr>
        </table>

        <div class="ttd-flow">
            <div class="role">INISIATOR PERUBAHAN<br/>${escapeHtml(initiatorPosition || '-')}</div>
            ${sig}
            <div class="signame">${escapeHtml(initiatorName)}</div>
            <div>NIP. ${escapeHtml(initiatorNip)}</div>
        </div>
    </div>`;
}

/** Dokumen PDF Formulir Inisiasi Perubahan lengkap. */
export function changeInitiationHtml(data) {
    return wrapDocument(
        `Formulir Inisiasi Perubahan${data?.docNumber ? ` - ${data.docNumber}` : ''}`,
        changeInitiationBody(data),
        CHANGE_DOC_STYLES,
    );
}
