import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

    const resp = await supabase.auth.signInWithPassword({ email, password });
    if (resp.error) return { error: resp.error };
    // supabase returns session with user
    setUser(resp.data.user || null);
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data?.session?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      // unsubscribe if possible
      // @ts-ignore
      if (listener && listener.subscription && typeof listener.subscription.unsubscribe === 'function') {
        // @ts-ignore
        listener.subscription.unsubscribe();
      }
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
