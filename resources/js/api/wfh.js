import client from './client';

export const wfhApi = {
    // === Attendance ===
    checkIn: (formData) =>
        client.post('/wfh/attendance', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // === Reports ===
    getReports: (params = {}) =>
        client.get('/wfh/reports', { params }),

    getReport: (id) =>
        client.get(`/wfh/reports/${id}`),

    createReport: (data) =>
        client.post('/wfh/reports', data),

    updateReport: (id, data) =>
        client.put(`/wfh/reports/${id}`, data),

    deleteReport: (id) =>
        client.delete(`/wfh/reports/${id}`),

    submitReport: (id) =>
        client.post(`/wfh/reports/${id}/submit`),

    // === PDF ===
    getReportPdf: (id) =>
        client.get(`/wfh/reports/${id}/pdf`, { responseType: 'blob' }),
};
