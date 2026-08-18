/* Helper tanggal WFH — logika murni, diuji unit via Vitest (setup branch Gita). */

/** tanggal "YYYY-MM-DD" → 1..7 (Senin..Minggu), cocokkan allowed_days */
export function wfhDayNumber(date: string): number {
  const iso = new Date(date + "T00:00:00").getDay(); // 0=Min..6=Sab
  return iso === 0 ? 7 : iso;
}

export function capFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Hari ini dalam "YYYY-MM-DD" (UTC). */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO datetime → "HH.MM" (fallback: potong string saat tak valid). */
export function fmtWaktu(iso?: string): string {
  if (!iso) return "-";
  const norm = iso.length > 23 ? iso.slice(0, 23) + "Z" : iso;
  const d = new Date(norm);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 5).replace(":", ".");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

/** report_date ISO UTC ("2026-07-30T17:00:00.000000Z") → "YYYY-MM-DD" WIB */
export function normDate(iso: string): string {
  return iso.includes("T") || iso.includes("Z")
    ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    : iso.slice(0, 10);
}

/** "YYYY-MM-DD" (atau hari ini bila kosong) → "Senin, 10 Agustus 2026" */
export function todayDisplay(d?: string): string {
  const date = d ? new Date(d + "T00:00:00") : new Date();
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
