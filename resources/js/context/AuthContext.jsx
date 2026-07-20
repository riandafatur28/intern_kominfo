import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
            const res = await axios.get('/api/auth/me');
            setUser(res.data.data);
        } catch {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh user data without touching loading state (silent refresh)
    const refreshPermissions = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get('/api/auth/me');
            setUser(res.data.data);
        } catch {
            // ignore — keep current user state
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Auto-refresh permissions when API returns 403 (permission changed server-side)
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 403) {
                    // permissions mungkin berubah di server, refresh user data
                    await refreshPermissions();
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [refreshPermissions]);

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        const { token, user: userData } = res.data.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch {
            // ignore
        }
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const hasPermission = (perm) => {
        if (!user) return false;
        return user.permissions?.includes(perm) ?? false;
    };

    const hasRole = (role) => {
        if (!user) return false;
        return user.roles?.includes(role) ?? false;
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading, fetchUser, refreshPermissions,
            hasPermission, hasRole,
            isAuthenticated: !!user,
            demoMode: false,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
