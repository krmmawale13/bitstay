// apps/frontend/src/pages/login.tsx
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white shadow-sm border border-slate-200 rounded-2xl p-6"
      >
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-500 mt-1">Use your account credentials</p>

        <label className="block mt-6 text-sm text-slate-700">Email</label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label className="block mt-4 text-sm text-slate-700">Password</label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl px-4 py-2 bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
