import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('servora_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('servora_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiClient.get('/auth/me');
        if (res.data?.success && res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('servora_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = async (loginIdentifier, password) => {
    const res = await apiClient.post('/auth/login', {
      login: loginIdentifier,
      password: password,
    });

    if (res.data?.success && res.data?.data) {
      const { user: userData, token: userToken } = res.data.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('servora_token', userToken);
      localStorage.setItem('servora_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }

    return { success: false, message: res.data?.message || 'Gagal login.' };
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('servora_token');
      localStorage.removeItem('servora_user');
    }
  };

  const role = user?.role?.name || null;
  const assignedStations = user?.assigned_stations || [];

  const value = {
    user,
    token,
    role,
    assignedStations,
    isLoading,
    login,
    logout,
    isAdmin: role === 'admin',
    isWaiter: role === 'waiter',
    isKitchen: role === 'kitchen',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

