/* Logika murni halaman Monitoring WFH — diuji unit via Vitest. */
import type { MonitoringUser, WfhReport } from "../api/wfh";

export type MonitoringRow = WfhReport | (MonitoringUser & { _draft?: boolean });

/** Opsi urutan baris monitoring (client-side). */
export type SortKey = "name-asc" | "name-desc" | "date-new" | "date-old";

/** Nama pegawai dari baris gabungan (laporan terkirim / user belum laporan). */
export function rowName(x: MonitoringRow): string {
  return ("status" in x ? x.user?.name : x.name) ?? "";
}

/** Tanggal baris (YYYY-MM-DD); fallback ke tanggal filter untuk user belum laporan. */
export function rowDate(x: MonitoringRow, fallbackDate: string): string {
  if ("status" in x) return (x.report_date ?? "").slice(0, 10);
  return (x._report?.report_date ?? fallbackDate).slice(0, 10);
}

/** Urutkan baris monitoring: nama A-Z/Z-A atau tanggal terbaru/terlama. */
export function sortMonitoringRows(
  rows: MonitoringRow[],
  sortBy: SortKey,
  fallbackDate: string
): MonitoringRow[] {
  const sorted = [...rows];
  switch (sortBy) {
    case "name-asc":
      sorted.sort((a, b) => rowName(a).localeCompare(rowName(b)));
      break;
    case "name-desc":
      sorted.sort((a, b) => rowName(b).localeCompare(rowName(a)));
      break;
    case "date-new":
      sorted.sort((a, b) =>
        rowDate(b, fallbackDate).localeCompare(rowDate(a, fallbackDate))
      );
      break;
    case "date-old":
      sorted.sort((a, b) =>
        rowDate(a, fallbackDate).localeCompare(rowDate(b, fallbackDate))
      );
      break;
  }
  return sorted;
}

/** Inisial dari nama: 2 kata pertama → "Andi Pratama" → "AP". */
export function inisial(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Gabungan laporan terkirim + pegawai yang belum mengirim, difilter client-side
 * (search / tim / status) — sama dengan useMemo di WfhMonitoring.
 */
export function buildMonitoringRows(
  reports: WfhReport[],
  missingUsers: MonitoringUser[],
  statusFilter: string,
  teamId: string,
  search: string
): MonitoringRow[] {
  const q = search.trim().toLowerCase();
  const base: MonitoringRow[] = [
    ...reports,
    ...(statusFilter ? [] : missingUsers),
  ];
  const scoped = teamId
    ? base.filter((x) => "status" in x || x.team_id === Number(teamId))
    : base;
  if (!q) return scoped;
  return scoped.filter((x) =>
    ("status" in x ? x.user?.name : x.name)?.toLowerCase().includes(q)
  );
}