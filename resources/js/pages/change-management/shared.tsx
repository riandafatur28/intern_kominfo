import type { ChangePriority, ChangeImpact, ChangeStatus } from "../../api/changeManagement";

export const STATUS_LABEL: Record<ChangeStatus, { label: string; color: string }> = {
  draft: { label: "Draf", color: "bg-gray-100 text-gray-600" },
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

// 1. Disesuaikan dengan "normal" | "emergency"
export const PRIORITY_LABEL: Record<ChangePriority, { label: string; color: string }> = {
  normal: { label: "Normal", color: "bg-blue-100 text-blue-700" },
  emergency: { label: "Emergency", color: "bg-amber-100 text-amber-700" },
};

// 2. Disesuaikan dengan "Minor" | "Mayor"
export const IMPACT_LABEL: Record<ChangeImpact, string> = {
  Minor: "Minor",
  Mayor: "Mayor",
};

// 3. Opsi Form Prioritas
export const PRIORITY_OPTIONS: { value: ChangePriority; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "emergency", label: "Emergency" },
];

// 4. Opsi Form Dampak
export const IMPACT_OPTIONS: { value: ChangeImpact; label: string }[] = [
  { value: "Minor", label: "Minor" },
  { value: "Mayor", label: "Mayor" },
];

/** Cosmetic ITIL-style classification badge shown next to the doc number. */
export function changeClassLabel(priority: ChangePriority | undefined): string {
  // 5. Cukup cek jika "emergency"
  return priority === "emergency" ? "Emergency Change" : "Normal Change";
}

export function statusBadge(status: string) {
  return STATUS_LABEL[status as ChangeStatus] ?? { label: status, color: "bg-gray-100 text-gray-600" };
}

export function priorityBadge(priority: string) {
  return PRIORITY_LABEL[priority as ChangePriority] ?? { label: priority, color: "bg-gray-100 text-gray-600" };
}