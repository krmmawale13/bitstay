import MainLayout from "@/components/MainLayout";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";

// Non-breaking toast bridge
function toast(type: "success" | "error" | "info", message: string, description?: string) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__toast?.push) w.__toast.push({ type, message, description });
  try { window.dispatchEvent(new CustomEvent("app:toast", { detail: { type, message, description } })); } catch {}
}

export default function ProfileSettingsPage() {
  const [user, setUser] = useState(() =>
    typeof window === "undefined" ? null : getCurrentUser()
  );

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // init from currentUser
  useEffect(() => {
    const cu = getCurrentUser();
    setUser(cu);
    setName(cu?.name ?? "");
    // if you ever store avatar url in currentUser.avatar
    // setAvatar((cu as any)?.avatar ?? null);
  }, []);

  // cross-tab sync
  useEffect(() => {
    const sync = () => {
      const cu = getCurrentUser();
      setUser(cu);
      setName(cu?.name ?? "");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const email = useMemo(() => user?.email ?? "", [user]);
  const role = useMemo(() => (user?.role ? String(user.role).toUpperCase() : ""), [user]);

  const fileRef = useRef<HTMLInputElement>(null);

  const onSave = async () => {
    try {
      // For now: client-only persist (no API) to avoid rework later
      const cu = getCurrentUser();
      if (!cu) throw new Error("Not signed in");
      const updated = { ...cu, name };
      setCurrentUser(updated);
      setUser(updated);
      toast("success", "Profile saved", "Your display name has been updated.");
    } catch (e: any) {
      toast("error", "Failed to save", e?.message || "Try again");
    }
  };

  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // preview only (future: upload to API, then save URL to currentUser)
    const url = URL.createObjectURL(f);
    setAvatar(url);
    toast("info", "Preview loaded", "This is a local preview. Upload wiring coming soon.");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow px-6 py-5">
          <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Update your personal details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Email</label>
                <input
                  value={email}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Role</label>
                <input
                  value={role}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800 px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={onSave}
                className="rounded-xl px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-medium transition"
              >
                Save changes
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Name saves locally for now; API wiring coming soon.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow p-6">
            <div className="text-sm font-semibold mb-3">Profile picture</div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden">
                {avatar ? (
                  // preview
                  <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-slate-500 text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={onPickFile}
                  className="rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
                >
                  Choose file
                </button>
                <button
                  onClick={() => setAvatar(null)}
                  className="rounded-xl px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-400/40 hover:bg-rose-500/20 transition"
                >
                  Remove
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Uploading to server will be added later; this is a local preview only.
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
