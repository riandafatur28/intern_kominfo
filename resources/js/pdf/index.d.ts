/** Declarations for the client-side print-to-PDF templates (resources/js/pdf/*.js). */

export interface WfhPrintKegiatan {
  waktu: string;
  kegiatan: string;
  links?: string[];
}

export interface WfhReportPrintData {
  nama?: string;
  nip?: string;
  pangkat?: string;
  jabatan?: string;
  unitKerja?: string;
  tanggalPelaksanaan?: string;
  kegiatan?: WfhPrintKegiatan[];
  isApproved?: boolean;
  makerName?: string;
  makerNip?: string;
  makerSignatureUrl?: string;
  supervisorName?: string;
  supervisorNip?: string;
  supervisorSignatureUrl?: string;
  qrImageUrl?: string;
  city?: string;
  logoUrl?: string;
  bsreLogoUrl?: string;
}

export interface WfhAttendancePrintRow {
  no?: number;
  nama: string;
  pagi?: string | null;
  siang?: string | null;
  sore?: string | null;
}

export interface WfhAttendancePrintData {
  judul?: string;
  tanggal?: string;
  unitKerja?: string;
  rows?: WfhAttendancePrintRow[];
  logoUrl?: string;
  makerName?: string;
  makerNip?: string;
  makerSignatureUrl?: string;
  supervisorName?: string;
  supervisorNip?: string;
  supervisorSignatureUrl?: string;
  city?: string;
}

export function printWfhReport(data: WfhReportPrintData, opts?: { autoClose?: boolean }): void;
export function printWfhAttendance(data: WfhAttendancePrintData, opts?: { autoClose?: boolean }): void;
export function printWfhFull(
  args: { report?: WfhReportPrintData; attendance?: WfhAttendancePrintData; title?: string },
  opts?: { autoClose?: boolean }
): void;
export function wfhReportHtml(data: WfhReportPrintData): string;
export function wfhAttendanceHtml(data: WfhAttendancePrintData): string;
export function wfhFullHtml(args: {
  report?: WfhReportPrintData;
  attendance?: WfhAttendancePrintData;
  title?: string;
}): string;
export function printHtmlDocument(html: string, opts?: { autoClose?: boolean }): void;
export function escapeHtml(value: unknown): string;
