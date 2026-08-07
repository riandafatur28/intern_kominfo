import type { WfhReport } from "../api/wfh";
import type { WfhReportPrintData, WfhAttendancePrintData } from "./index";

/** Bulan Indonesia untuk format "30 Juli 2026" (match wfhh.pdf). */
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function tanggalId(iso?: string | null): string {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso.slice(0, 10);
  return `${d} ${BULAN[m - 1] ?? ""} ${y}`;
}

/** "YYYY-MM-DD HH:MM:SS" / ISO → "H.i" ("07.30") — format waktu di wfhh.pdf. */
function waktuHi(iso?: string | null): string {
  if (!iso) return "-";
  const norm = iso.length > 23 ? iso.slice(0, 23) + "Z" : iso;
  const dt = new Date(norm);
  if (Number.isNaN(dt.getTime())) return iso.slice(0, 5);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getHours())}.${pad(dt.getMinutes())}`;
}

function assetUrl(p?: string | null): string | undefined {
  if (!p) return undefined;
  return `${window.location.origin}/storage/${p}`;
}

/** Map WfhReport (API resource) → data template PDF individu. */
export function buildReportPrintData(
  report: WfhReport,
  unitKerja?: string
): WfhReportPrintData {
  const u = report.user;
  return {
    nama: u?.name,
    nip: u?.nip,
    pangkat: u?.rank ?? "-",
    jabatan: u?.position ?? "-",
    unitKerja: unitKerja || "-",
    tanggalPelaksanaan: tanggalId(report.report_date),
    kegiatan: (report.activities ?? []).map((a) => ({
      waktu: `${waktuHi(a.start_time)} – ${waktuHi(a.end_time)}`,
      kegiatan: a.activity,
      links: (a.links ?? []).map((l) => l.url).filter(Boolean),
    })),
    isApproved: report.status === "approved",
    makerName: u?.name,
    makerNip: u?.nip,
    makerSignatureUrl: assetUrl(u?.signature_path),
    supervisorName: report.supervisor?.name ?? "-",
    supervisorNip: report.supervisor?.nip ?? "-",
    supervisorSignatureUrl: assetUrl(report.supervisor?.signature_path),
    // qrImageUrl: tidak tersedia client-side (QR hanya dihasilkan BE via blade)
  };
}

/** Map WfhReport attendances → tabel foto absensi (pagi/siang/sore). */
export function buildAttendancePrintData(
  report: WfhReport,
  unitKerja?: string
): WfhAttendancePrintData {
  const bySession: Record<string, string | null> = { pagi: null, siang: null, sore: null };
  for (const att of report.attendances ?? []) {
    bySession[att.session] = att.photo_url ?? null;
  }
  return {
    tanggal: tanggalId(report.report_date),
    unitKerja: unitKerja || "-",
    rows: [
      {
        nama: report.user?.name ?? "-",
        pagi: bySession.pagi,
        siang: bySession.siang,
        sore: bySession.sore,
      },
    ],
    makerName: report.user?.name,
    makerNip: report.user?.nip,
    supervisorName: report.supervisor?.name ?? "-",
    supervisorNip: report.supervisor?.nip ?? "-",
  };
}
