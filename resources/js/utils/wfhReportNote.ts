import type { WfhReport } from "../api/wfh";

type WfhSession = "pagi" | "siang" | "sore";
const SESI: WfhSession[] = ["pagi", "siang", "sore"];
const NAMES: Record<WfhSession, string> = { pagi: "Pagi", siang: "Siang", sore: "Sore" };

/** Catatan detail absensi + pengumpulan tugas untuk satu laporan. */
export function catatanLaporan(r: WfhReport): string {
  if (r.status === "rejected" && r.reject_reason) return r.reject_reason;

  const atts = r.attendances ?? [];
  const attOf = (s: WfhSession) => atts.find((a) => a.session === s);
  const belum = SESI.filter((s) => !attOf(s)); // tak ada catatan sama sekali
  const noHadir = SESI.filter((s) => attOf(s)?.checked_in === false); // ada catatan tapi tidak hadir
  const nAct = (r.activities ?? []).length;

  const parts: string[] = [];
  if (atts.length === 0) {
    parts.push("Belum ada absensi");
  } else {
    if (noHadir.length) parts.push(`Tidak hadir ${noHadir.map((s) => NAMES[s]).join(", ")}`);
    if (belum.length) parts.push(`Belum absen ${belum.map((s) => NAMES[s]).join(", ")}`);
    if (!noHadir.length && !belum.length) parts.push("Absensi lengkap");
  }
  parts.push(nAct === 0 ? "Belum upload tugas" : `Tugas ${nAct} kegiatan`);
  return parts.join(" · ");
}
