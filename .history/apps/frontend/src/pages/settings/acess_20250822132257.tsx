import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function isAdmin(): boolean {
  const cu = readJSON<any>("currentUser", null);
  const role = cu?.role ? String(cu.role).toUpperCase() : "";
  return role === "ADMIN";
}
function hasPerm(key: string): boolean {
  const list = readJSON<string[]>("permissions", []);
  return new Set(list).has(key);
}

export default function AccessControlPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const admin = useMemo(() => isAdmin(), []);
  const canView = admin || hasPerm("dashboard.view"); // lenient for now

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.22),transparent_60%)] mix-blend-soft-light" />

      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen((s) => !s)} />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow px-6 py-5">
            <h1 className="text-xl sm:text-2xl font-semibold">Access Control</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage roles & permissions for your team. (placeholder UI)
            </p>
          </div>

          {!canView ? (
            <div className="rounded-2xl border border-amber-300/40 bg-amber-50/80 dark:bg-amber-900/40 backdrop-blur-xl shadow p-6">
              <div className="text-lg font-semibold mb-1">This area is locked</div>
              <p className="text-sm opacity-80">You don’t have permission to view access settings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Users list (placeholder) */}
              <section className="lg:col-span-1 rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
                <h3 className="text-base font-semibold mb-3">Users</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span>admin@bitstay.com</span>
                    <span className="text-xs rounded-md px-2 py-0.5 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">ADMIN</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>test@gmail.com</span>
                    <span className="text-xs rounded-md px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">MANAGER</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>krm@gmail.com</span>
                    <span className="text-xs rounded-md px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">RECEPTIONIST</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>krmtest@gmail.com</span>
                    <span className="text-xs rounded-md px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300">HOUSEKEEPING</span>
                  </li>
                </ul>
              </section>

              {/* Role matrix (placeholder) */}
              <section className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
                <h3 className="text-base font-semibold mb-3">Role Permissions (sample)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">Permission</th>
                        <th className="py-2 px-3">ADMIN</th>
                        <th className="py-2 px-3">MANAGER</th>
                        <th className="py-2 px-3">RECEPTIONIST</th>
                        <th className="py-2 px-3">HOUSEKEEPING</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-900 dark:text-slate-100">
                      {[
                        ["dashboard.view", "✓", "✓", "—", "—"],
                        ["customers.read", "✓", "✓", "✓", "—"],
                        ["bookings.read", "✓", "✓", "✓", "—"],
                        ["reports.view", "✓", "✓", "—", "—"],
                        ["inventory.read", "✓", "✓", "—", "—"],
                        ["pos.use", "✓", "✓", "—", "—"],
                      ].map((row) => (
                        <tr key={row[0]}>
                          <td className="py-2 pr-4">{row[0]}</td>
                          {row.slice(1).map((c, i) => (
                            <td key={i} className="py-2 px-3">{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                  This is a visual placeholder. In Phase 3, we’ll add editing: role assignment, user overrides, and save to backend.
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
