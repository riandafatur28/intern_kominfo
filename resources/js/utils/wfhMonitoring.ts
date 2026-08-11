/* Logika murni halaman Monitoring WFH — diuji unit via Vitest. */
import type { MonitoringUser, WfhReport } from "../api/wfh";

export type MonitoringRow = WfhReport | (MonitoringUser & { _draft?: boolean });

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