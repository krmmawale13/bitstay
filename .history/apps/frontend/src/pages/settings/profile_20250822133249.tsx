import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

type CU = {
  name?: string;
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
};

function readCurrentUser(): CU | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("currentUser") || "null"); } catch { return null; }
}

export default function ProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [cu, setCu] = useState<CU | null>(() => readCurrentUser());
  useEffect(() => {
    const onStorage = () => setCu(readCurrentUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const fullName = useMemo(() => {
    if (!cu) return "User";
    if (cu.first_name || cu.last_name) return `${cu.first_name ?? ""} ${cu.last_name ?? ""}`.trim();
    return cu.name ?? "User";
  }, [cu]);

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  const savePrefs = () => {
    // future: POST /me/preferences
    if ((window as any).__toast?.push) {
      (window as any).__toast.push({ type: "success", message: "Preferences saved" });
    } else {
      console.log("[toast:success] Preferences saved");
    }
  };

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.22),transparent_60%)] mix-blend-soft-light" />

      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen((s) => !s)} />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow px-6 py-5">
            <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Your account information & preferences.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic info */}
            <section className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
              <h3 className="text-base font-semibold mb-4">Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Full name</label>
                  <input
                    className="w-full rounded-xl border border-slate-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    value={fullName}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Email</label>
                  <input
                    className="w-full rounded-xl border border-slate-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    value={cu?.email ?? ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Role</label>
                  <input
                    className="w-full rounded-xl border border-slate-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    value={cu?.role ?? ""}
                    readOnly
                  />
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Change password</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input placeholder="Current password" type="password"
                         className="rounded-xl border border-slate-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2" />
                  <input placeholder="New password" type="password"
                         className="rounded-xl border border-slate-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2" />
                  <input placeholder="Confirm new password" type="password"
                         className="rounded-xl border border-slate-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2" />
                </div>
                <button
                  onClick={() => {
                    // future: POST /me/change-password
                    (window as any).__toast?.push
                      ? (window as any).__toast.push({ type: "info", message: "Password change coming soon" })
                      : console.log("[toast:info] Password change coming soon");
                  }}
                  className="mt-3 inline-flex items-center rounded-xl px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white transition"
                >
                  Update password
                </button>
              </div>
            </section>

            {/* Preferences */}
            <section className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-5">
              <h3 className="text-base font-semibold mb-4">Preferences</h3>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
                Email notifications
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
                In-app notifications
              </label>

              <button
                onClick={savePrefs}
                className="mt-4 w-full inline-flex items-center justify-center rounded-xl px-4 py-2 bg-slate-800/90 text-white hover:bg-slate-800"
              >
                Save preferences
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
