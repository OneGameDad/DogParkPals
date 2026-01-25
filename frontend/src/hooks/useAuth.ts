import { useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types';

const DEV_FORCE_LOGIN = false;

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(DEV_FORCE_LOGIN);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkSession = async () => {
            if (DEV_FORCE_LOGIN) return;
            try {
                const user = await api.get<User>('/auth/me');
                setIsAuthenticated(true);
                setUser(user);
            } catch {
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        const handleLogin = () => checkSession();
        const handleLogout = () => {
            setIsAuthenticated(false);
            setUser(null);
        };

        window.addEventListener('auth:login', handleLogin);
        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:login', handleLogin);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    return { isAuthenticated, user, loading };
}
