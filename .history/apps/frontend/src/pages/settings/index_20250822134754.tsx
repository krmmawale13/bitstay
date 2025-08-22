import MainLayout from "../../components/MainLayout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { User, Palette, Bell } from "lucide-react";

export default function SettingsHome() {
  const [user, setUser] = useState(() =>
    typeof window === "undefined" ? null : getCurrentUser()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setUser(getCurrentUser());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const displayName = useMemo(() => user?.name ?? "User", [user]);
  const email = useMemo(() => user?.email ?? "user@example.com", [user]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow px-6 py-5">
          <h1 className="text-xl sm:text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Personalize your workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile */}
          <Link
            href="/settings/profile"
            className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/15 border border-sky-500/30 grid place-items-center">
                <User className="text-sky-600" size={18} />
              </div>
              <div>
                <div className="font-semibold">Profile</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {displayName} · {email}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Update your name, avatar and contact details.
            </div>
          </Link>

          {/* Appearance */}
          <button
            onClick={() => {
              const cur = document.documentElement.classList.contains("dark");
              const next = !cur;
              document.documentElement.classList.toggle("dark", next);
              localStorage.setItem("theme", next ? "dark" : "light");
              try {
                window.dispatchEvent(
                  new CustomEvent("app:toast", {
                    detail: { type: "info", message: `Theme: ${next ? "Dark" : "Light"}` },
                  })
                );
              } catch {}
            }}
            className="text-left rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 grid place-items-center">
                <Palette className="text-indigo-600" size={18} />
              </div>
              <div>
                <div className="font-semibold">Appearance</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle light/dark theme
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Switch themes to your preference.
            </div>
          </button>

          {/* Notifications (placeholder) */}
          <button
            onClick={() => {
              try {
                (window as any).__notify?.push({
                  title: "Sample notification",
                  body: "This is how alerts will appear.",
                });
              } catch {}
            }}
            className="text-left rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 grid place-items-center">
                <Bell className="text-amber-600" size={18} />
              </div>
              <div>
                <div className="font-semibold">Notifications</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Preview notification style
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Click to preview a notification. (Config coming soon)
            </div>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
