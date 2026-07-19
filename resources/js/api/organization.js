import client from './client';

export const orgApi = {
    // Profile
    getProfile: () =>
        client.get('/profile'),

    updateProfile: (data) =>
        client.put('/profile', data),

    uploadSignature: (formData) =>
        client.post('/profile/signature', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    uploadPhoto: (formData) =>
        client.post('/profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // Users
    getUsers: (params = {}) =>
        client.get('/admin/users', { params }),

    getUser: (id) =>
        client.get(`/admin/users/${id}`),

    createUser: (data) =>
        client.post('/admin/users', data),

    updateUser: (id, data) =>
        client.put(`/admin/users/${id}`, data),

    deleteUser: (id) =>
        client.delete(`/admin/users/${id}`),

    importUsers: (formData) =>
        client.post('/admin/users/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // Roles & Permissions
    getRoles: () =>
        client.get('/admin/roles'),

    updateRolePermissions: (id, permissions) =>
        client.put(`/admin/roles/${id}/permissions`, { permissions }),

    getPermissions: () =>
        client.get('/admin/permissions'),
};
