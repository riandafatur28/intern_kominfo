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
 * Fetch Google Spreadsheet sync status (connection, stats, synced data,
 * history, structure). Row counts are real DB counts.
 */
export async function getSpreadsheetSync(params = {}) {
    const res = await axios.get('/api/admin/wfh/spreadsheet', { params });
    return res.data.data;
}
