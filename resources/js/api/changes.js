import client from './client';

export const changesApi = {
    // === Initiation ===
    getInitiations: (params = {}) =>
        client.get('/changes/initiations', { params }),

    getInitiation: (id) =>
        client.get(`/changes/initiations/${id}`),

    createInitiation: (data) =>
        client.post('/changes/initiations', data),

    submitInitiation: (id) =>
        client.post(`/changes/initiations/${id}/submit`),

    approveInitiation: (id) =>
        client.post(`/changes/initiations/${id}/approve`),

    rejectInitiation: (id, reason) =>
        client.post(`/changes/initiations/${id}/reject`, { reason }),

    reviseInitiation: (id) =>
        client.post(`/changes/initiations/${id}/revise`),

    // === Implementation ===
    createImplementation: (initiationId, data) =>
        client.post(`/changes/initiations/${initiationId}/implementations`, data),

    getImplementation: (id) =>
        client.get(`/changes/implementations/${id}`),

    updateImplementation: (id, data) =>
        client.put(`/changes/implementations/${id}`, data),

    submitImplementation: (id) =>
        client.post(`/changes/implementations/${id}/submit`),

    reviewImplementation: (id, data) =>
        client.post(`/changes/implementations/${id}/review`, data),

    uploadAttachments: (id, formData) =>
        client.post(`/changes/implementations/${id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // === PDF ===
    getInitiationPdf: (id) =>
        client.get(`/changes/initiations/${id}/pdf`, { responseType: 'blob' }),

    getImplementationPdf: (id) =>
        client.get(`/changes/implementations/${id}/pdf`, { responseType: 'blob' }),
};
