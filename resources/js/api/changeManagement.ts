import client from "./client";

/* ── Type definitions matching OpenAPI spec (Change Package) ────────── */

export type ChangeStatus = "draft" | "pending" | "approved" | "rejected";
export type ChangePriority = "normal" | "emergency"; 
export type ChangeImpact = "Minor" | "Mayor";       
export type ImplementationStatus = "draft" | "submitted" | "completed" | "rejected";

export interface ChangeType {
  id: number;
  name: string;
}

export interface ChangePackageUserNested {
  id: number;
  name: string;
  nip: string;
  position: string | null;
  rank: string | null;
  signature_path: string | null;
}

export interface InitiationResource {
  id: number;
  field_id: number;
  initiator_id: number;
  reviewer_id: number | null;
  doc_number: string;
  initiation_date: string;
  needed_by_date: string | null;
  description: string;
  reason: string;
  status: ChangeStatus;
  review_status: "approved" | "rejected" | null;
  reviewed_at: string | null;
  initiator_signed_at: string | null;
  created_at: string;
  field?: { id: number; name: string };
  initiator?: ChangePackageUserNested;
}

export interface ChangeAttachment {
  id: number;
  path: string;
  url: string;
  sort_order: number;
}

export interface ImplementationResource {
  id: number;
  change_initiation_id: number;
  priority: ChangePriority;
  impact: ChangeImpact;
  production_impact: string | null;
  required_effort: string | null;
  cost_needed: boolean | null;
  cost_amount: number | string | null;
  resources: string | null;
  test_plan: string | null;
  evaluator_id: number | null;
  evaluator_signed_at: string | null;
  review_status: "diterima" | "ditolak" | null;
  review_response: string | null;
  execution_date: string | null;
  reviewer_id: number | null;
  reviewer_signed_at: string | null;
  implementation_result: string | null;
  release_date: string | null;
  responsible_id: number | null;
  responsible_signed_at: string | null;
  status: ImplementationStatus;
  change_types?: ChangeType[];
  attachments?: ChangeAttachment[];
}

export interface ChangePackage {
  initiation: InitiationResource;
  implementation: ImplementationResource | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ChangePackageInitiationPayload {
  field_id?: number;
  needed_by_date?: string;
  description?: string;
  reason?: string;
}

export interface ChangePackageImplementationPayload {
  priority?: ChangePriority;
  impact?: ChangeImpact;
  production_impact?: string;
  required_effort?: string;
  cost_needed?: boolean;
  cost_amount?: number | string | null;
  resources?: string;
  test_plan?: string;
  change_type_ids?: number[];
  execution_date?: string | null;
  release_date?: string;
  implementation_result?: string;
  review_response?: string;
}

export interface ChangePackagePayload {
  initiation: ChangePackageInitiationPayload;
  implementation: ChangePackageImplementationPayload;
}

/* ── Change Types (reference data) ───────────────────────────────────── */

/** GET /api/change-types */
export async function listChangeTypes(): Promise<{ success: boolean; data: ChangeType[] }> {
  const res = await client.get("/change-types");
  return res.data;
}

/* ── Change Packages ──────────────────────────────────────────────────── */

/** GET /api/changes */
export async function listChangePackages(params?: {
  per_page?: number;
  status?: ChangeStatus;
  field_id?: number;
}): Promise<{ success: boolean; data: ChangePackage[]; meta: PaginationMeta }> {
  const res = await client.get("/changes", { params });
  return res.data;
}

/** POST /api/changes — creates a draft package */
export async function createChangePackage(
  payload: ChangePackagePayload
): Promise<{ success: boolean; message: string; data: ChangePackage }> {
  const res = await client.post("/changes", payload);
  return res.data;
}

/** GET /api/changes/{id} */
export async function getChangePackage(
  id: number
): Promise<{ success: boolean; data: ChangePackage }> {
  const res = await client.get(`/changes/${id}`);
  return res.data;
}

/** PUT /api/changes/{id} — only allowed while status === draft, only by initiator */
export async function updateChangePackage(
  id: number,
  payload: ChangePackagePayload
): Promise<{ success: boolean; message: string; data: ChangePackage }> {
  const res = await client.put(`/changes/${id}`, payload);
  return res.data;
}

/** DELETE /api/changes/{id} — only allowed while status === draft, only by initiator */
export async function deleteChangePackage(
  id: number
): Promise<{ success: boolean; message: string }> {
  const res = await client.delete(`/changes/${id}`);
  return res.data;
}

/** POST /api/changes/{id}/submit — persists full payload then transitions draft -> pending */
export async function submitChangePackage(
  id: number,
  payload: ChangePackagePayload
): Promise<{ success: boolean; message: string; data: ChangePackage }> {
  const res = await client.post(`/changes/${id}/submit`, payload);
  return res.data;
}

/** POST /api/changes/{id}/approve */
export async function approveChangePackage(
  id: number
): Promise<{ success: boolean; message: string; data: ChangePackage }> {
  const res = await client.post(`/changes/${id}/approve`);
  return res.data;
}

/** POST /api/changes/{id}/reject */
export async function rejectChangePackage(
  id: number
): Promise<{ success: boolean; message: string; data: ChangePackage }> {
  const res = await client.post(`/changes/${id}/reject`);
  return res.data;
}

/** POST /api/changes/{id}/attachments — only while parent package status === draft */
export async function uploadChangePackageAttachments(
  id: number,
  files: File[]
): Promise<{ success: boolean; message: string; data: ChangeAttachment[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files[]", file));
  const res = await client.post(`/changes/${id}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* ── PDF export URLs (used with openPdfDirect) ───────────────────────── */

export function getChangeInitiationPdfUrl(id: number): string {
  return `/api/changes/${id}/pdf/initiation`;
}

export function getChangeImplementationPdfUrl(id: number): string {
  return `/api/changes/${id}/pdf/implementation`;
}

/* ── Error helper ─────────────────────────────────────────────────────── */

export function extractChangeError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message ?? fallback;
  }
  return fallback;
}

/**
 * Laravel validation failures (422) carry a per-field `errors` map keyed by dotted
 * paths, e.g. `initiation.needed_by_date` / `implementation.test_plan`. The top-level
 * `message` only ever names the first one ("...and 3 more errors"), which leaves the
 * user guessing — pull the full map out so each field can show its own message.
 */
export function extractChangeFieldErrors(err: unknown): Record<string, string> {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
    const errors = axiosErr.response?.data?.errors;
    if (errors) {
      const out: Record<string, string> = {};
      for (const [key, messages] of Object.entries(errors)) {
        if (Array.isArray(messages) && messages.length > 0) out[key] = messages[0];
      }
      return out;
    }
  }
  return {};
}
