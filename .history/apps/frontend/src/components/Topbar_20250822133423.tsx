import { Bell, Search, User, Settings, LogOut, Moon, Sun, CheckCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { logout as doLogout } from "@/services/auth.service";
import { getCurrentUser } from "@/lib/auth";

/* LS helpers */
function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function getActiveTenantIdFromLS(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
}
function getActiveTenantName(): string | null { return readJSON<string | null>("activeTenantName", null); }

interface TopbarProps { toggleSidebar: () => void; }
type UINotification = { id: string; title: string; body?: string; ts?: number; seen?: boolean };

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const router = useRouter();

  /* THEME */
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefers = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const _isDark = saved ? saved === "dark" : prefers;
    setDarkMode(_isDark); document.documentElement.classList.toggle("dark", _isDark);
  }, []);
  const toggleTheme = () => {
    setDarkMode((prev) => { const next = !prev; document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light"); return next; });
  };

  /* USER / TENANT */
  const [user, setUser] = useState(() => (typeof window === "undefined" ? null : getCurrentUser()));
  const [activeTenantId, setActiveTenantId] = useState<string | null>(() => getActiveTenantIdFromLS());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => { setUser(getCurrentUser()); setActiveTenantId(getActiveTenantIdFromLS()); };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const has = getActiveTenantIdFromLS(); if (has) return;
    const cu = getCurrentUser(); const fallback =
      (Array.isArray(cu?.tenants) && cu.tenants.length ? cu.tenants[0] : undefined) ?? cu?.tenantId ?? null;
    if (fallback != null) { const t = String(fallback); localStorage.setItem("activeTenantId", t); setActiveTenantId(t); }
  }, [user]);

  const tenantName = useMemo(() => getActiveTenantName(), [activeTenantId]);
  const showTenantBadge = Boolean(tenantName || (activeTenantId && activeTenantId !== "1"));
  const displayName = useMemo(() => user?.name ?? "User", [user]);
  const displayEmail = useMemo(() => user?.email ?? "user@example.com", [user]);

  /* ACCOUNT MENU */
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (!accountRef.current) return; if (!accountRef.current.contains(e.target as Node)) setAccountOpen(false); };
    if (accountOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [accountOpen]);

  const onLogout = () => {
    try {
      if (typeof doLogout === "function") { doLogout(); }
      else {
        localStorage.removeItem("token"); localStorage.removeItem("activeTenantId");
        localStorage.removeItem("currentUser"); localStorage.removeItem("permissions");
      }
    } finally {
      // ensure it goes to existing loginPage
      if (typeof window !== "undefined") window.location.replace("/loginpage");
      else router.push("/loginpage");
    }
  };

  /* SEARCH (Enter → /search?query=...) + Cmd/Ctrl+K focus */
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault(); inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);
  const submitSearch = () => { const query = q.trim(); if (!query) return; router.push(`/search?query=${encodeURIComponent(query)}`); };

  /* NOTIFICATIONS (local bridge) */
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const unseenCount = notifications.filter((n) => !n.seen).length;
  useEffect(() => {
    if (typeof window === "undefined") return;
    const api = {
      push: (n: Omit<UINotification, "id" | "ts" | "seen">) =>
        setNotifications((prev) => [{ id: crypto.randomUUID(), ts: Date.now(), seen: false, ...n }, ...prev]),
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, seen: true }))),
      clear: () => setNotifications([]),
    };
    (window as any).__notify = api;
    const onCustom = (e: Event) => { const ev = e as CustomEvent<any>; if (ev?.detail) api.push(ev.detail); };
    window.addEventListener("app:notify", onCustom as any);
    return () => {
      if ((window as any).__notify === api) (window as any).__notify = undefined;
      window.removeEventListener("app:notify", onCustom as any);
    };
  }, []);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (!notifRef.current) return; if (!notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
    if (notifOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [notifOpen]);

  /* Nav targets per your ask */
  const goProfile = () => router.push("/profile");   // personal profile page
  const goSettings = () => router.push("/settings"); // user settings hub (NOT access control)

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="relative px-4 md:px-6 py-3 shadow border-b border-transparent
                 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500
                 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
                 before:content-[''] before:absolute before:inset-0 before:pointer-events-none
                 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_28%,rgba(255,255,255,0)_60%)]
                 before:opacity-60 before:mix-blend-soft-light"
    >
      {/* Row 1 */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={toggleSidebar}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl
                     bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
          aria-label="Toggle sidebar">☰</button>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-xl font-bold text-white">BitStay</span>
          <span className="ml-2 text-sm font-medium text-white/90">CRM Dashboard</span>
          {showTenantBadge && (
            <span className="ml-3 rounded-md bg-white/20 border border-white/30 text-white/95 text-xs px-2 py-0.5"
                  title={tenantName ? tenantName : `Tenant ${activeTenantId}`}>
              {tenantName ? tenantName : `Tenant ${activeTenantId}`}
            </span>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex items-center justify-between relative">
        {/* Search */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[60%] max-w-xl hidden sm:block">
          <div className="flex items-center bg-white/95 dark:bg-gray-800/95 rounded-full px-3 py-1.5 shadow-md 
                          focus-within:ring-2 focus-within:ring-white/50 dark:focus-within:ring-teal-400
                          transition-all duration-200 hover:shadow-lg">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            <input
              ref={inputRef} type="text" value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
              placeholder="Search anything…  (Ctrl/Cmd + K)"
              className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white 
                         placeholder-gray-500 dark:placeholder-gray-400 w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Theme */}
          <motion.button whileHover={{ scale: 1.1 }} onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl
                       bg-white/10 hover:bg-white/20 border border-white/20 transition"
            aria-label="Toggle theme" title={darkMode ? "Switch to light" : "Switch to dark"}>
            {darkMode ? <Sun className="text-yellow-300" size={18} /> : <Moon className="text-white/90" size={18} />}
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setNotifOpen((v) => !v)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl
                         bg-white/10 hover:bg-white/20 border border-white/20 transition"
              aria-label="Notifications" title="Notifications">
              <Bell className="text-white/90" size={18} />
              {unseenCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                  {unseenCount}
                </span>
              )}
            </motion.button>

            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
                           border border-white/20 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Notifications</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setNotifications((p) => p.map((n) => ({ ...n, seen: true })))}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10" title="Mark all as read">
                      <CheckCheck size={14} /> Read
                    </button>
                    <button onClick={() => setNotifications([])}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10" title="Clear all">
                      <Trash2 size={14} /> Clear
                    </button>
                  </div>
                </div>
                <hr className="border-white/20 dark:border-gray-700" />
                <div className="max-h-72 overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-600 dark:text-gray-400 text-center">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{n.title}</div>
                            {n.body && <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{n.body}</div>}
                            {n.ts && <div className="text-gray-400 dark:text-gray-500 text-[11px] mt-1">{new Date(n.ts).toLocaleString()}</div>}
                          </div>
                          {!n.seen && <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-red-500" title="New" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Account */}
          <div className="relative" ref={accountRef}>
            <motion.button whileHover={{ scale: 1.02 }} onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
              aria-haspopup="menu" aria-expanded={accountOpen} title="Account">
              <User size={18} />
              <span className="hidden sm:inline font-medium">{displayName}</span>
            </motion.button>

            {accountOpen && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-56 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl
                           border border-white/20 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 text-xs text-gray-700 dark:text-gray-400">
                  Signed in as
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{displayEmail}</div>
                </div>
                <hr className="border-white/20 dark:border-gray-700" />
                <button onClick={goProfile}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-white/60 dark:hover:bg-gray-800/60">
                  <User className="w-5 h-5" /> Profile
                </button>
                <button onClick={goSettings}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-white/60 dark:hover:bg-gray-800/60">
                  <Settings className="w-5 h-5" /> Settings
                </button>
                <button onClick={onLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
