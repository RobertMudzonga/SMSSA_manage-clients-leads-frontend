import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';

interface AuthContextValue {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const computeIsAdmin = (u: any | null) => {
    if (!u || !u.email) return false;
    return u.email.toLowerCase().endsWith('@immigrationspecialists.co.za');
  };

  const login = async (email: string, password: string) => {
    // Only allow emails from specific domain
    if (!email.toLowerCase().endsWith('@immigrationspecialists.co.za')) {
      return { error: { message: 'Email domain not allowed' } };
    }

    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await r.json().catch(() => null);
      if (!r.ok) return { error: json || { message: 'Login failed' } };
      setUser(json.user || null);
      try { localStorage.setItem('smssa_user', JSON.stringify(json.user || null)); localStorage.setItem('userEmail', json.user?.email || email); } catch (e) {}
      return {};
    } catch (err) {
      return { error: err };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
    setUser(null);
    try { localStorage.removeItem('smssa_user'); localStorage.removeItem('userEmail'); } catch (e) {}
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Read persisted user from localStorage if present
        const s = localStorage.getItem('smssa_user');
        if (s) setUser(JSON.parse(s));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    isAdmin: computeIsAdmin(user),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
