// apps/frontend/src/components/Topbar.tsx
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4">
      <div className="font-semibold text-slate-900">Dashboard</div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-600">
          {user?.name ?? user?.email ?? "—"}
        </div>
        <button
          onClick={logout}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
