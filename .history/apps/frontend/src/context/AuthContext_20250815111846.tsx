// apps/frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { http } from "@/services/http";
import type { User } from "@/types/user";
import { useRouter } from "next/router";

type AuthContextShape = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextShape | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    try {
      const { data } = await http.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await http.post("/auth/login", { email, password }); // backend sets httpOnly cookie
      await refresh();
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await http.post("/auth/logout");
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
