import client from "./client";

/* ── Type definitions matching OpenAPI spec ─────────────────────── */

export interface WfhReportActivity {
  id: number;
  start_time: string;
  end_time: string;
  activity: string;
  sort_order: number;
  links: { id: number; url: string; sort_order?: number }[];
}

export interface ReportUserNested {
  id: number;
  name: string;
  nip: string;
  position: string | null;
  rank: string | null;
  signature_path: string | null;
}

export interface WfhReport {
  id: number;
  user_id: number;
  report_date: string;
  status: "draft" | "pending" | "approved" | "rejected";
  maker_signed_at: string | null;
  supervisor_signed_at: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  user: ReportUserNested;
  supervisor: ReportUserNested | null;
  activities: WfhReportActivity[];
  activity_count: number;
  attendances?: {
    id: number;
    session: "pagi" | "siang" | "sore";
    checked_in: boolean;
    photo_url: string | null;
  }[];
}

export interface WfhTeamReport {
  id: number;
  team_id: number;
  report_date: string;
  status: "draft" | "pending" | "approved" | "rejected";
  created_by: number;
  supervisor_id: number | null;
  maker_signed_at: string | null;
  supervisor_signed_at: string | null;
  reject_reason: string | null;
  verification_token: string | null;
  created_at: string;
  updated_at: string;
  team: { id: number; name: string };
  creator: ReportUserNested;
  supervisor: ReportUserNested | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface AttendanceData {
  id: number;
  date: string;
  session: "pagi" | "siang" | "sore";
  photo_url: string;
  check_in_at: string;
}

export interface MonitoringUser {
  id: number;
  name: string;
  nip: string;
  email: string;
  rank: string | null;
  position: string | null;
  phone: string | null;
  is_active: boolean;
  team_id: number | null;
  team: { id: number; name: string } | null;
}

export interface WfhSessionConfig {
  sessions: string[];
  allowed_days: number[];
}

export interface TeamNested {
  id: number;
  name: string;
}

/* ── WFH Reports ────────────────────────────────────────────────── */

/** GET /api/wfh/reports */
export async function listWfhReports(params?: {
  per_page?: number;
  /** Filter server-side: tanggal pasti "YYYY-MM-DD" */
  date?: string;
  /** Filter server-side: bulan "YYYY-MM" */
  month?: string;
}): Promise<{ success: boolean; data: WfhReport[]; meta: PaginationMeta }> {
  const res = await client.get("/wfh/reports", { params });
  return res.data;
}

/** POST /api/wfh/reports */
export async function createWfhReport(data: {
  report_date: string;
  status?: string;
  activities?: {
    start_time: string;
    end_time: string;
    activity: string;
    links?: string[];
  }[];
  attendances?: Record<string, File>;
}): Promise<{ success: boolean; message: string; data: WfhReport }> {
  const formData = new FormData();
  formData.append("report_date", data.report_date);
  if (data.status) formData.append("status", data.status);
  if (data.activities) {
    data.activities.forEach((act, i) => {
      formData.append(`activities[${i}][start_time]`, act.start_time);
      formData.append(`activities[${i}][end_time]`, act.end_time);
      formData.append(`activities[${i}][activity]`, act.activity);
      act.links?.forEach((url, j) => {
        formData.append(`activities[${i}][links][${j}]`, url);
      });
    });
  }
  if (data.attendances) {
    Object.entries(data.attendances).forEach(([session, file]) => {
      formData.append(`attendances[${session}][photo]`, file);
    });
  }
  const res = await client.post("/wfh/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** GET /api/wfh/reports/{report} */
export async function getWfhReport(
  reportId: number
): Promise<{ success: boolean; data: WfhReport }> {
  const res = await client.get(`/wfh/reports/${reportId}`);
  return res.data;
}

/** PUT /api/wfh/reports/{report} */
export async function updateWfhReport(
  reportId: number,
  data: { report_date: string }
): Promise<{ success: boolean; message: string; data: WfhReport }> {
  const res = await client.put(`/wfh/reports/${reportId}`, data);
  return res.data;
}

/** DELETE /api/wfh/reports/{report} */
export async function deleteWfhReport(
  reportId: number
): Promise<{ success: boolean; message: string }> {
  const res = await client.delete(`/wfh/reports/${reportId}`);
  return res.data;
}

/** POST /api/wfh/reports/{report}/submit */
export async function submitWfhReport(
  reportId: number
): Promise<{ success: boolean; message: string; data: WfhReport }> {
  const res = await client.post(`/wfh/reports/${reportId}/submit`);
  return res.data;
}

/** POST /api/wfh/reports/{report}/approve */
export async function approveWfhReport(
  reportId: number
): Promise<{ success: boolean; message: string; data: WfhReport }> {
  const res = await client.post(`/wfh/reports/${reportId}/approve`);
  return res.data;
}

/** POST /api/wfh/reports/{report}/reject */
export async function rejectWfhReport(
  reportId: number,
  data: { reason: string }
): Promise<{ success: boolean; message: string; data: WfhReport }> {
  const res = await client.post(`/wfh/reports/${reportId}/reject`, data);
  return res.data;
}

/** POST /api/wfh/reports/{report}/revise */
export async function reviseWfhReport(
  reportId: number
): Promise<{ success: boolean; message: string; data: WfhReport }> {
  const res = await client.post(`/wfh/reports/${reportId}/revise`);
  return res.data;
}

/* ── WFH Report Activities ──────────────────────────────────────── */

/** GET /api/wfh/reports/{report}/activities */
export async function listReportActivities(
  reportId: number
): Promise<{ success: boolean; data: WfhReportActivity[] }> {
  const res = await client.get(`/wfh/reports/${reportId}/activities`);
  return res.data;
}

/** POST /api/wfh/reports/{report}/activities */
export async function createReportActivity(
  reportId: number,
  data: {
    start_time: string;
    end_time: string;
    activity: string;
    links?: { url: string }[];
  }
): Promise<{ success: boolean; message: string; data: WfhReportActivity }> {
  const res = await client.post(`/wfh/reports/${reportId}/activities`, data);
  return res.data;
}

/** PUT /api/wfh/reports/{report}/activities/{activity} */
export async function updateReportActivity(
  reportId: number,
  activityId: number,
  data: {
    start_time?: string;
    end_time?: string;
    activity?: string;
    links?: { url: string }[];
  }
): Promise<{ success: boolean; message: string; data: WfhReportActivity }> {
  const res = await client.put(
    `/wfh/reports/${reportId}/activities/${activityId}`,
    data
  );
  return res.data;
}

/** DELETE /api/wfh/reports/{report}/activities/{activity} */
export async function deleteReportActivity(
  reportId: number,
  activityId: number
): Promise<{ success: boolean; message: string }> {
  const res = await client.delete(
    `/wfh/reports/${reportId}/activities/${activityId}`
  );
  return res.data;
}

/** POST /api/wfh/reports/{report}/activities/reorder */
export async function reorderReportActivities(
  reportId: number,
  ids: number[]
): Promise<{ success: boolean; message: string }> {
  const res = await client.patch(
    `/wfh/reports/${reportId}/activities/reorder`,
    { ids }
  );
  return res.data;
}

/* ── WFH Attendance ─────────────────────────────────────────────── */

/** POST /api/wfh/reports/{report}/attendances */
export async function addReportAttendance(
  reportId: number,
  data: { session: string; photo: File }
): Promise<{ success: boolean; message: string; data: AttendanceData }> {
  const formData = new FormData();
  formData.append("session", data.session);
  formData.append("photo", data.photo);
  const res = await client.post(
    `/wfh/reports/${reportId}/attendances`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

/** DELETE /api/wfh/reports/{report}/attendances/{attendance} */
export async function deleteReportAttendance(
  reportId: number,
  attendanceId: number
): Promise<{ success: boolean; message: string }> {
  const res = await client.delete(
    `/wfh/reports/${reportId}/attendances/${attendanceId}`
  );
  return res.data;
}

/** GET /api/wfh/reports/{report}/pdf — returns HTML that prints as PDF */
export function getReportPdfUrl(reportId: number): string {
  return `/api/wfh/reports/${reportId}/pdf`;
}

/* ── WFH Session Config ─────────────────────────────────────────── */

/** GET /api/wfh/session-config */
export async function getWfhSessionConfig(): Promise<{
  success: boolean;
  data: WfhSessionConfig;
}> {
  const res = await client.get("/wfh/session-config");
  return res.data;
}

/* ── WFH Monitoring ─────────────────────────────────────────────── */

export interface WfhMonitoringData {
  date: string;
  team_id: number | null;
  field_id: number | null;
  not_checked_in: MonitoringUser[];
  no_report: MonitoringUser[];
}

/** GET /api/admin/wfh/monitoring */
export async function getWfhMonitoring(params?: {
  date?: string;
  team_id?: number;
}): Promise<{ success: boolean; data: WfhMonitoringData }> {
  const res = await client.get("/admin/wfh/monitoring", { params });
  return res.data;
}

/* ── Admin: list reports in field ───────────────────────────────── */

/** GET /api/admin/wfh/reports */
export async function adminListWfhReports(params?: {
  per_page?: number;
  team_id?: number;
  status?: string;
  /** Filter server-side: tanggal pasti "YYYY-MM-DD" */
  date?: string;
  /** Filter server-side: bulan "YYYY-MM" */
  month?: string;
  date_from?: string;
  date_to?: string;
}): Promise<{ success: boolean; data: WfhReport[]; meta: PaginationMeta }> {
  const res = await client.get("/admin/wfh/reports", { params });
  return res.data;
}

/* ── Team Report PDF ────────────────────────────────────────────── */

export function getTeamReportPdfUrl(
  teamId: number,
  date: string,
  teamReportId?: number
): string {
  const params = new URLSearchParams({ date });
  if (teamReportId) params.set("team_report_id", String(teamReportId));
  return `/api/admin/wfh/teams/${teamId}/pdf?${params}`;
}

/** Fetch report PDF as blob with auth (window.open kehilangan Bearer → 401 → route login tak ada) */
export function fetchReportPdf(reportId: number): Promise<Blob> {
  return client
    .get(`/wfh/reports/${reportId}/pdf`, { responseType: "blob" })
    .then((res) => res.data as Blob);
}

export function fetchTeamReportPdf(
  teamId: number,
  date: string,
  teamReportId?: number
): Promise<Blob> {
  const params = new URLSearchParams({ date });
  if (teamReportId) params.set("team_report_id", String(teamReportId));
  return client
    .get(`/admin/wfh/teams/${teamId}/pdf?${params}`, { responseType: "blob" })
    .then((res) => res.data as Blob);
}

/* ── WFH Team Reports ───────────────────────────────────────────── */

export interface TeamReportListResponse {
  success?: boolean;
  data: WfhTeamReport[];
  /** BE returns raw Laravel paginator without meta envelope */
  meta?: PaginationMeta;
}

/** GET /api/admin/wfh/team-reports */
export async function listTeamReports(params?: {
  per_page?: number;
}): Promise<TeamReportListResponse> {
  const res = await client.get("/admin/wfh/team-reports", { params });
  return res.data;
}

/** POST /api/admin/wfh/team-reports */
export async function createTeamReport(data: {
  team_id: number;
  report_date: string;
}): Promise<{ success: boolean; message: string; data: WfhTeamReport }> {
  const res = await client.post("/admin/wfh/team-reports", data);
  return res.data;
}

/** POST /api/admin/wfh/team-reports/{id}/approve */
export async function approveTeamReport(
  id: number
): Promise<{ success: boolean; message: string; data: WfhTeamReport }> {
  const res = await client.post(`/admin/wfh/team-reports/${id}/approve`);
  return res.data;
}

/** POST /api/admin/wfh/team-reports/{id}/reject */
export async function rejectTeamReport(
  id: number,
  data: { reason: string }
): Promise<{ success: boolean; message: string; data: WfhTeamReport }> {
  const res = await client.post(`/admin/wfh/team-reports/${id}/reject`, data);
  return res.data;
}

/* ── Error helper ───────────────────────────────────────────────── */

export function extractWfhError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message ?? fallback;
  }
  return fallback;
}
