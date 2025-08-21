// apps/frontend/src/pages/login.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);

  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  // restore remembered email
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("rememberEmail");
    if (saved) setEmail(saved);
  }, []);

  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (!email.trim()) return "Email is required.";
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    return ok ? "" : "Please enter a valid email.";
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!password.trim()) return "Password is required.";
    return password.length >= 4 ? "" : "Password must be at least 4 characters.";
  }, [password, touched.password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    // mark touched to trigger errors
    setTouched({ email: true, password: true });
    if (emailError || passwordError) return;

    try {
      await login(email.trim(), password);
      if (remember) localStorage.setItem("rememberEmail", email.trim());
      else localStorage.removeItem("rememberEmail");
      router.push("/"); // redirect home/dashboard
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.25),transparent_60%)] mix-blend-soft-light" />

      {/* Center Card */}
      <div className="relative z-10 min-h-screen grid place-items-center p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-6 sm:p-8 text-white"
        >
          {/* Brand / Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold leading-none">Sign in</h1>
              <p className="text-sm text-white/80 mt-1">
                Welcome back! Please enter your details.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {err && (
            <div className="mb-4 rounded-lg border border-red-300/40 bg-red-500/20 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          {/* Email */}
          <label htmlFor="email" className="block text-sm mb-1 text-white/90">
            Email
          </label>
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 bg-white/90 text-slate-900
              ${emailError ? "border-red-400 ring-2 ring-red-300" : "border-white/40 focus-within:ring-2 focus-within:ring-sky-300"}`}
          >
            <Mail size={16} className="text-slate-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
          {emailError && <p className="mt-1 text-xs text-red-200">{emailError}</p>}

          {/* Password */}
          <label htmlFor="password" className="block text-sm mt-4 mb-1 text-white/90">
            Password
          </label>
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 bg-white/90 text-slate-900
              ${passwordError ? "border-red-400 ring-2 ring-red-300" : "border-white/40 focus-within:ring-2 focus-within:ring-sky-300"}`}
          >
            <Lock size={16} className="text-slate-500" />
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="text-slate-500 hover:text-slate-700 transition"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && <p className="mt-1 text-xs text-red-200">{passwordError}</p>}

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-white/40 bg-white/80 text-sky-600 focus:ring-sky-400"
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-sm text-white/90 hover:text-white underline-offset-2 hover:underline"
              onClick={() => alert("Forgot password flow coming soon")}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2
                       bg-sky-500 hover:bg-sky-400 text-white font-medium transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>

          {/* Helper footer */}
          <p className="mt-4 text-xs text-white/80">
            By signing in you agree to our{" "}
            <span className="underline underline-offset-4">Terms</span> and{" "}
            <span className="underline underline-offset-4">Privacy Policy</span>.
          </p>
        </form>
      </div>
    </div>
  );
}
