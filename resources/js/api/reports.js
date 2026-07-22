import axios from 'axios';

/**
 * Fetch the current user's WFH reports (paginated).
 * @param {Object} params - { page, per_page }
 * @returns {Promise<{ data: Array, meta: Object }>}
 */
export async function getReports(params = {}) {
    const res = await axios.get('/api/wfh/reports', { params });
    return res.data;
}

/**
 * Fetch a single WFH report detail (with activities + links).
 */
export async function getReport(id) {
    const res = await axios.get(`/api/wfh/reports/${id}`);
    return res.data.data;
}

/**
 * Create a new WFH report with its activities.
 * @param {Object} payload - {
 *   wfh_attendance_id?: number|null,
 *   report_date: 'YYYY-MM-DD',
 *   activities: [{ start_time: 'HH:mm', end_time: 'HH:mm', activity: string, links?: string[] }]
 * }
 */
export async function createReport(payload) {
    const res = await axios.post('/api/wfh/reports', payload);
    return res.data;
}

/**
 * Update an existing WFH report (report_date + full activities list).
 */
export async function updateReport(id, payload) {
    const res = await axios.put(`/api/wfh/reports/${id}`, payload);
    return res.data;
}

/**
 * Delete a WFH report.
 */
export async function deleteReport(id) {
    const res = await axios.delete(`/api/wfh/reports/${id}`);
    return res.data;
}

/**
 * Submit a report for supervisor approval.
 */
export async function submitReport(id) {
    const res = await axios.post(`/api/wfh/reports/${id}/submit`);
    return res.data;
}
