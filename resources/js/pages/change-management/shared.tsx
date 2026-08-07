import type { ChangePriority, ChangeImpact, ChangeStatus } from "../../api/changeManagement";

export const STATUS_LABEL: Record<ChangeStatus, { label: string; color: string }> = {
  draft: { label: "Draf", color: "bg-gray-100 text-gray-600" },
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

export const PRIORITY_LABEL: Record<ChangePriority, { label: string; color: string }> = {
  low: { label: "Rendah", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Sedang", color: "bg-blue-100 text-blue-700" },
  high: { label: "Tinggi", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Kritis", color: "bg-red-100 text-red-700" },
};

export const IMPACT_LABEL: Record<ChangeImpact, string> = {
  low: "Minor",
  medium: "Sedang",
  high: "Mayor",
};

export const PRIORITY_OPTIONS: { value: ChangePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const IMPACT_OPTIONS: { value: ChangeImpact; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/** Cosmetic ITIL-style classification badge shown next to the doc number. */
export function changeClassLabel(priority: ChangePriority | undefined): string {
  return priority === "critical" || priority === "high" ? "Emergency Change" : "Normal Change";
}

export function statusBadge(status: string) {
  return STATUS_LABEL[status as ChangeStatus] ?? { label: status, color: "bg-gray-100 text-gray-600" };
}

export function priorityBadge(priority: string) {
  return PRIORITY_LABEL[priority as ChangePriority] ?? { label: priority, color: "bg-gray-100 text-gray-600" };
}
