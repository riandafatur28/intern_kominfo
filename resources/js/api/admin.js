import client from './client';

/**
 * Fetch paginated users.
 * @param {Object} params - { page, per_page, search, role }
 */
export async function getUsers(params = {}) {
    const res = await client.get('/admin/users', { params });
    return res.data;
}

/**
 * Delete a user.
 * @param {number} id
 */
export async function deleteUser(id) {
    const res = await client.delete(`/admin/users/${id}`);
    return res.data;
}

/**
 * Update an existing user.
 * @param {number} id
 * @param {Object} payload - { name, nip, email, team_id, rank, position, phone, is_active, roles[] }
 */
export async function updateUser(id, payload) {
    const res = await client.put(`/admin/users/${id}`, payload);
    return res.data;
}

/**
 * Create a new user.
 * @param {Object} payload - { name, nip, email, team_id, rank, position, phone, password, roles[] }
 */
export async function createUser(payload) {
    const res = await client.post('/admin/users', payload);
    return res.data;
}

/**
 * Fetch all roles with their permissions (requires role.manage).
 * Returns [{ id, name, permissions }].
 */
export async function getRoles() {
    const res = await client.get('/admin/roles');
    return res.data.data;
}

/**
 * Fetch all available permissions (requires permission.manage).
 * Returns [{ id, name }].
 */
export async function getPermissions() {
    const res = await client.get('/admin/permissions');
    return res.data.data;
}

/**
 * Update/sync permissions for a role (requires role.manage).
 * @param {number} id - Role ID
 * @param {string[]} permissions - Array of permission names to assign
 */
export async function updateRolePermissions(id, permissions) {
    const res = await client.put(`/admin/roles/${id}/permissions`, { permissions });
    return res.data;
}

/**
 * Fetch fields (bidang) list for the add-user form.
 */
export async function getFields() {
    const res = await client.get('/admin/fields');
    return res.data.data;
}

/**
 * Fetch teams filtered by field_id for the add-user form dropdown.
 * @param {number|null} fieldId
 */
export async function getTeams(fieldId) {
    const params = fieldId ? { field_id: fieldId } : {};
    const res = await client.get('/admin/teams', { params });
    return res.data.data;
}

/**
 * Fetch admin WFH reports (paginated, filtered by admin's field).
 * @param {Object} params - { status, team_id, date_from, date_to, page, per_page }
 */
export async function getAdminReports(params = {}) {
    const res = await client.get('/admin/wfh/reports', { params });
    return res.data;
}

/**
 * Fetch the per-employee WFH monitoring board for a date.
 * @param {Object} params - { date, search, status, page, per_page }
 */
export async function getMonitoringBoard(params = {}) {
    const res = await client.get('/admin/wfh/monitoring/board', { params });
    return res.data.data;
}

/**
 * Fetch a single WFH report detail (activities + links) for preview.
 */
export async function getReportDetail(id) {
    const res = await client.get(`/wfh/reports/${id}`);
    return res.data.data;
}

/**
 * Fetch Google Spreadsheet sync status (connection, stats, synced data,
 * history, structure). Row counts are real DB counts.
 */
export async function getSpreadsheetSync(params = {}) {
    const res = await client.get('/admin/wfh/spreadsheet', { params });
    return res.data.data;
}
