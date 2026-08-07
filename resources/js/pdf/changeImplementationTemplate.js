import { escapeHtml } from './printDocument';
import { changeKopHtml, wrapDocument, CHANGE_DOC_STYLES } from './shared';

/** Delapan opsi tipe perubahan, ditata 2 kolom (kiri/kanan) seperti formulir. */
const TIPE_ROWS = [
    ['Hardware', 'Network'],
    ['Software', 'Utilities'],
    ['Aplikasi', 'Prosedur'],
    ['Operating System', 'Personil'],
];

const chk = (on) => (on ? 'v' : '');

/**
 * Definisi lebar kolom TETAP (5 kolom) yang dipakai SEMUA tabel form pada dokumen,
 * agar seluruh garis kotak sejajar rapi.
 * col1 label | col2 cek | col3 opsi | col4 cek | col5 opsi
 */
const COLGROUP = `<colgroup>
    <col style="width:32%" /><col style="width:5%" /><col style="width:29%" /><col style="width:5%" /><col style="width:29%" />
</colgroup>`;

/** Baris label + isian (isian menempati 4 kolom sisanya). */
function rowValue(label, value, minClass = '') {
    return `<tr><td class="label">${label}</td><td colspan="4" class="${minClass}">${value || '&nbsp;'}</td></tr>`;
}

/** Baris label + dua pilihan (cek/teks) — mengisi tepat 5 kolom. */
function rowChoice(label, leftOn, leftText, rightOn, rightText) {
    return `<tr>
        <td class="label">${label}</td>
        <td class="chk">${chk(leftOn)}</td><td>${leftText}</td>
        <td class="chk">${chk(rightOn)}</td><td>${rightText}</td>
    </tr>`;
}

/** Baris label + (Nama/Bidang/Jabatan) + Tanda Tangan — mengisi 5 kolom via colspan. */
function rowSignature(label, { name = '', field = '', position = '', signatureUrl } = {}) {
    const sig = signatureUrl
        ? `<img class="sig" src="${escapeHtml(signatureUrl)}" alt="ttd" />`
        : '<div class="sig-space"></div>';
    return `<tr>
        <td class="label">${label}</td>
        <td colspan="2" class="sigcell">
            Nama&nbsp;&nbsp;&nbsp;: ${escapeHtml(name)}<br/>
            Bidang&nbsp;: ${escapeHtml(field)}<br/>
            Jabatan: ${escapeHtml(position)}
        </td>
        <td colspan="2" style="text-align:center">
            Tanda Tangan
            ${sig}
        </td>
    </tr>`;
}

/**
 * Bagian isi Formulir Persetujuan / Implementasi Perubahan (2 halaman).
 * (Lihat JSDoc parameter pada versi sebelumnya — struktur data sama.)
 */
export function changeImplementationBody(data) {
    const {
        docNumber = '', tanggal = '', halaman = '',
        bidang = '-',
        changeTypeNames = [], priority = '', impact = '',
        productionImpact = '', requiredEffort = '',
        costNeeded = null, costAmount = '', resources = '', testPlan = '',
        evaluator = {}, reviewStatus = '', reviewResponse = '', executionDate = '',
        responsibleLabel = '', reviewer = {},
        implementationResult = '', testingResult = '', releaseDate = '',
        attachments = [], responsible = {},
        logoUrl = '/images/logo-jatim.png',
    } = data;

    const has = (name) => changeTypeNames.map((s) => String(s).toLowerCase()).includes(name.toLowerCase());
    const money = costAmount ? `Rp. ${Number(String(costAmount).replace(/\D/g, '')).toLocaleString('id-ID')}` : 'Rp.';
    // Tiga kondisi: belum dipilih (polos), Ada (coret Tidak), Tidak (coret Ada).
    const costCell = costNeeded === true ? 'Ada / <s>Tidak</s>'
        : costNeeded === false ? '<s>Ada</s> / Tidak'
            : 'Ada / Tidak';

    const tipeRows = TIPE_ROWS.map(([a, b]) => `
        <tr>
            ${a === TIPE_ROWS[0][0] ? '<td class="label" rowspan="4">Tipe Perubahan</td>' : ''}
            <td class="chk">${chk(has(a))}</td><td>${escapeHtml(a)}</td>
            <td class="chk">${chk(has(b))}</td><td>${escapeHtml(b)}</td>
        </tr>`).join('');

    const attImgs = attachments.length
        ? `<div class="img-wrap">${attachments.map((u) => `<img src="${escapeHtml(u)}" alt="bukti" />`).join('<br/>')}</div>`
        : '&nbsp;';

    // Satu aliran dokumen: Evaluasi → Tinjauan → Implementasi menyambung ke bawah.
    // Bila isi panjang, browser otomatis memindah ke halaman berikutnya.
    return `
    <div class="page">
        ${changeKopHtml({ title: 'FORMULIR PERSETUJUAN PERUBAHAN', docNumber, tanggal, halaman, logoUrl })}

        <table class="frow">
            <tr><td class="fk">Berdasarkan Inisiasi Bidang</td><td class="fs">:</td><td>${escapeHtml(bidang)}</td></tr>
        </table>

        <div class="meta">
            <div><span class="mk">Nomor</span><span class="ms">:</span><span class="mv">${escapeHtml(docNumber)}</span></div>
            <div><span class="mk">Tanggal</span><span class="ms">:</span><span class="mv">${escapeHtml(tanggal)}</span></div>
            <div><span class="mk">Halaman</span><span class="ms">:</span><span class="mv">${escapeHtml(String(halaman))}</span></div>
        </div>

        <div class="sec">Evaluasi Dampak Perubahan</div>
        <table class="form">
            ${COLGROUP}
            ${tipeRows}
            ${rowChoice('Prioritas Perubahan', priority === 'Normal', 'Normal', priority === 'Emergency', 'Emergency')}
            ${rowChoice('Dampak Perubahan', impact === 'Minor', 'Minor', impact === 'Mayor', 'Mayor')}
            ${rowValue('Dampak Terhadap Lingkungan Produksi', escapeHtml(productionImpact), 'box-min')}
            ${rowValue('Upaya / Tindakan yang diperlukan', escapeHtml(requiredEffort), 'box-min')}
            ${rowValue('Kebutuhan Biaya', `${costCell} &nbsp;&nbsp; Jumlah : ${escapeHtml(money)}`)}
            ${rowValue('Kebutuhan Sumber Daya<br/>(Personil, H/W, S/W)', escapeHtml(resources))}
            ${rowValue('Penjelasan Rencana Pengujian', escapeHtml(testPlan) || '-')}
            ${rowSignature('Dievaluasi Oleh', evaluator)}
        </table>

        <div class="sec">Tinjauan Perubahan</div>
        <table class="form">
            ${COLGROUP}
            ${rowChoice('Status Permintaan Perubahan', reviewStatus === 'diterima', 'DITERIMA', reviewStatus === 'ditolak', 'DITOLAK')}
            ${rowValue('Tanggapan', escapeHtml(reviewResponse), 'box-min')}
            ${rowValue('Tanggal Pelaksanaan Perubahan', escapeHtml(executionDate))}
            ${rowValue('Penanggungjawab Pelaksana Perubahan', escapeHtml(responsibleLabel))}
            ${rowSignature('Ditinjau Oleh', reviewer)}
        </table>

        <div class="sec">Implementasi Perubahan</div>
        <table class="form">
            ${COLGROUP}
            ${rowValue('Hasil Tanggapan Perubahan', escapeHtml(implementationResult), 'box-min')}
            ${rowValue('Hasil Pengujian Implementasi', `${escapeHtml(testingResult) ? `${escapeHtml(testingResult)}<br/>` : ''}${attImgs}`)}
            ${rowValue('Tanggal Rilis', escapeHtml(releaseDate))}
            ${rowSignature('Penanggungjawab Pelaksana Perubahan', responsible)}
        </table>
    </div>`;
}

/** Dokumen PDF Formulir Persetujuan / Implementasi Perubahan lengkap. */
export function changeImplementationHtml(data) {
    return wrapDocument(
        `Formulir Persetujuan Perubahan${data?.docNumber ? ` - ${data.docNumber}` : ''}`,
        changeImplementationBody(data),
        CHANGE_DOC_STYLES,
    );
}
