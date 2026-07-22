/**
 * Modul generate PDF dari frontend (client-side) untuk laporan WFH.
 *
 * Fungsi utama:
 * - printWfhReport(data)              : laporan kegiatan 1 pegawai (1 halaman)
 * - printWfhAttendance(data)          : laporan foto absensi
 * - printWfhFull({report, attendance}): 1 file = laporan kegiatan + foto absensi (2 bagian)
 * - printWfhReportsCombined(list)     : laporan kegiatan SEMUA pegawai jadi 1 file
 * - printWfhFullBatch(list)           : SEMUA pegawai, tiap orang: kegiatan + foto, jadi 1 file
 */

import { printHtmlDocument } from './printDocument';
import { wrapDocument } from './shared';
import { wfhReportHtml, wfhReportBody, wfhReportBatchHtml } from './wfhReportTemplate';
import { wfhAttendanceHtml, wfhAttendanceBody } from './wfhAttendanceTemplate';
import { changeInitiationHtml } from './changeInitiationTemplate';
import { changeImplementationHtml } from './changeImplementationTemplate';

export { escapeHtml, printHtmlDocument, openPrintWindow, fillPrintWindow } from './printDocument';
export { DOC_STYLES, wrapDocument } from './shared';
export { wfhReportHtml, wfhReportBody, wfhReportBatchHtml } from './wfhReportTemplate';
export { wfhAttendanceHtml, wfhAttendanceBody } from './wfhAttendanceTemplate';
export { changeInitiationHtml, changeInitiationBody } from './changeInitiationTemplate';
export { changeImplementationHtml, changeImplementationBody } from './changeImplementationTemplate';

/** Bangun HTML gabungan (kegiatan + foto absensi) untuk satu pegawai. */
export function wfhFullHtml({ report, attendance, title } = {}) {
    const body = `${wfhReportBody(report ?? {})}${wfhAttendanceBody(attendance ?? {})}`;
    return wrapDocument(title || `Laporan WFH - ${report?.nama ?? ''}`, body);
}

/** Bangun HTML gabungan untuk BANYAK pegawai (tiap orang: kegiatan + foto). */
export function wfhFullBatchHtml(list = [], meta = {}) {
    const title = meta.title || `Laporan WFH${meta.tanggal ? ` - ${meta.tanggal}` : ''}`;
    const body = list.length
        ? list.map(({ report, attendance }) => `${wfhReportBody(report ?? {})}${wfhAttendanceBody(attendance ?? {})}`).join('\n')
        : '<div class="page"><p class="muted" style="text-align:center;margin-top:40px">Tidak ada laporan untuk dicetak.</p></div>';
    return wrapDocument(title, body);
}

/** Cetak PDF laporan kegiatan untuk satu pegawai. */
export function printWfhReport(data, opts) {
    printHtmlDocument(wfhReportHtml(data), opts);
}

/** Cetak PDF laporan foto absensi (berdiri sendiri). */
export function printWfhAttendance(data, opts) {
    printHtmlDocument(wfhAttendanceHtml(data), opts);
}

/**
 * Cetak SATU file berisi 2 bagian untuk satu pegawai:
 *  halaman 1: laporan kegiatan, halaman 2: laporan foto absensi.
 * @param {Object} args - { report: {...}, attendance: {...}, title? }
 */
export function printWfhFull(args = {}, opts) {
    printHtmlDocument(wfhFullHtml(args), opts);
}

/**
 * Cetak laporan kegiatan SEMUA pegawai dalam satu file (satu halaman per orang).
 * @param {Array<Object>} list
 * @param {Object} [meta] - { title, tanggal }
 */
export function printWfhReportsCombined(list, meta, opts) {
    printHtmlDocument(wfhReportBatchHtml(list, meta), opts);
}

/**
 * Cetak SEMUA pegawai jadi satu file; tiap pegawai terdiri dari
 * laporan kegiatan + laporan foto absensi.
 * @param {Array<{report:Object, attendance:Object}>} list
 * @param {Object} [meta] - { title, tanggal }
 */
export function printWfhFullBatch(list = [], meta = {}, opts) {
    printHtmlDocument(wfhFullBatchHtml(list, meta), opts);
}

/** Cetak PDF Formulir Inisiasi Perubahan. */
export function printChangeInitiation(data, opts) {
    printHtmlDocument(changeInitiationHtml(data), opts);
}

/** Cetak PDF Formulir Persetujuan / Implementasi Perubahan. */
export function printChangeImplementation(data, opts) {
    printHtmlDocument(changeImplementationHtml(data), opts);
}
