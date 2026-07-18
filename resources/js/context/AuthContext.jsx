import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await authApi.me();
            setUser(res.data.data);
        } catch {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password) => {
        const res = await authApi.login(email, password);
        const { token, user: u } = res.data.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(u));
        setUser(u);
        return u;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch { /* ignore */ }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
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
            user, loading, login, logout, fetchUser,
            hasPermission, hasRole,
            isAuthenticated: !!user,
            demoMode: false,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
