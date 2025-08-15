import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuth } from '@/services/http';

type User = { id: number; email: string; role: string; name?: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
   loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (token) setAuth(token);
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, tokens } = res.data;
    setUser(user);
    setToken(tokens.access);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuth(undefined);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}