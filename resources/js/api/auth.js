import client from './client';

export const authApi = {
    login: (email, password) =>
        client.post('/auth/login', { email, password }),

    me: () =>
        client.get('/auth/me'),

    logout: () =>
        client.post('/auth/logout'),
};
