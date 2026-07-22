import axios from 'axios';

/**
 * Create a new user.
 * @param {Object} payload - { name, nip, email, team_id, rank, position, phone, password, roles[] }
 */
export async function createUser(payload) {
    const res = await axios.post('/api/admin/users', payload);
    return res.data;
}

/**
 * Fetch users (paginated). Requires user.manage.
 * @param {Object} params - { page, per_page }
 * @returns {Promise<{ data: Array, meta: Object }>}
 */
export async function getUsers(params = {}) {
    const res = await axios.get('/api/admin/users', { params });
    return res.data;
}

/**
 * Update an existing user.
 * @param {number} id
 * @param {Object} payload - { name, nip, email, team_id, rank, position, phone, is_active, roles[] }
 */
export async function updateUser(id, payload) {
    const res = await axios.put(`/api/admin/users/${id}`, payload);
    return res.data;
}

/**
 * Delete a user.
 */
export async function deleteUser(id) {
    const res = await axios.delete(`/api/admin/users/${id}`);
    return res.data;
}

/**
 * Fetch all roles (requires role.manage). Returns [{ id, name, permissions }].
 */
export async function getRoles() {
    const res = await axios.get('/api/admin/roles');
    return res.data.data;
}

/**
 * Fetch all teams for the add-user form dropdown. Returns [{ id, name, field }].
 */
export async function getTeams() {
    const res = await axios.get('/api/admin/teams');
    return res.data.data;
}

/**
 * Derive the unique list of fields (bidang) from teams.
 * NOTE: sumber saat ini /admin/teams (butuh user.manage). Idealnya backend
 * menyediakan endpoint GET /fields yang bisa diakses semua inisiator.
 * @returns {Promise<Array<{id:number, name:string}>>}
 */
export async function getFields() {
    const res = await axios.get('/api/admin/teams');
    const teams = res.data.data ?? [];
    const map = new Map();
    teams.forEach((t) => { if (t.field) map.set(t.field.id, t.field); });
    return [...map.values()];
}

/**
 * Fetch admin WFH reports (paginated, filtered by admin's field).
 * @param {Object} params - { status, team_id, date_from, date_to, page, per_page }
 */
export async function getAdminReports(params = {}) {
    const res = await axios.get('/api/admin/wfh/reports', { params });
    return res.data;
}

/**
 * Fetch the per-employee WFH monitoring board for a date.
 * @param {Object} params - { date, search, status, page, per_page }
 */
export async function getMonitoringBoard(params = {}) {
    const res = await axios.get('/api/admin/wfh/monitoring/board', { params });
    return res.data.data;
}

/**
 * Fetch a single WFH report detail (activities + links) for preview.
 */
export async function getReportDetail(id) {
    const res = await axios.get(`/api/wfh/reports/${id}`);
    return res.data.data;
}

/**
 * Approve a submitted (pending) WFH report. Requires wfh.report.approve.
 * Backend records supervisor_signed_at using the approver's signature.
 */
export async function approveReport(id) {
    const res = await axios.post(`/api/wfh/reports/${id}/approve`);
    return res.data;
}

/**
 * Reject a submitted (pending) WFH report with a reason. Requires wfh.report.reject.
 */
export async function rejectReport(id, reason) {
    const res = await axios.post(`/api/wfh/reports/${id}/reject`, { reason });
    return res.data;
}

/**
 * Fetch Google Spreadsheet sync status (connection, stats, synced data,
 * history, structure). Row counts are real DB counts.
 */
export async function getSpreadsheetSync(params = {}) {
    const res = await axios.get('/api/admin/wfh/spreadsheet', { params });
    return res.data.data;
}
