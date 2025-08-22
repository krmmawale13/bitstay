// apps/frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import http from "@/lib/http"; // uses NEXT_PUBLIC_API_BASE
import { setCurrentUser, type CurrentUser } from "@/lib/auth";
import Router from "next/router";

type LoginResponse = {
  token: string;
  user: CurrentUser & {
    tenantId?: number | string | null;
    tenants?: Array<number | string> | null;
  };
};

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setActiveTenantLocally(id: number | string | null) {
  if (typeof window === "undefined") return;
  if (id === null || id === undefined || id === "") {
    localStorage.removeItem("activeTenantId");
    localStorage.removeItem("tenantId");
    return;
  }
  const v = String(id);
  localStorage.setItem("activeTenantId", v); // canonical
  localStorage.setItem("tenantId", v);       // legacy (some modules still read this)
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // baseURL already set in http; just call relative path
      const res = await http.post<LoginResponse>("/auth/login", { email, password });
      const { token, user } = res.data;

      // 1) token for interceptor
      localStorage.setItem("token", token);

      // 2) pick active tenant (multi or single)
      const active =
        (Array.isArray(user.tenants) && user.tenants.length ? user.tenants[0] : undefined) ??
        user.tenantId ??
        null;
      setActiveTenantLocally(active);

      // 3) persist currentUser (consistent app-wide)
      setCurrentUser(user);

      // (optional) quick debug
      // console.debug("[auth] login", {
      //   activeTenantId: localStorage.getItem("activeTenantId"),
      //   hasUser: !!localStorage.getItem("currentUser"),
      // });

      // 4) redirect
      Router.push("/dashboard");
    } catch (err: any) {
      // bubble precise API error if present
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      console.error("Login failed:", msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ login, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
