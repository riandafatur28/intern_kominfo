import axios from 'axios';

/**
 * Fetch admin WFH dashboard aggregate stats.
 * @param {Object} params - { month, year, field_id, date }
 * @returns {Promise<Object>} dashboard data
 */
export async function getDashboardStats(params = {}) {
    const res = await axios.get('/api/admin/wfh/dashboard', { params });
    return res.data.data;
}
