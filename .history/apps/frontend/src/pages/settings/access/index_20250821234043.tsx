import { useEffect, useState } from "react";
import RoleMatrix from "@/components/settings/access/RoleMatrix";
import UserOverrides from "@/components/settings/access/UserOverrides";
import AddUserModal from "@/components/settings/access/AddUserModal";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import MainLayout from "@/layouts/MainLayout";
import { ShieldCheck, Bug } from "lucide-react";
import http from "@/lib/http";

type WhoAmI = {
  fromAuthGuard_user?: any;
  fromTenantGuard_tenant?: any;
  tenantIdProp?: any;
  headers?: { authorization?: string | null; ["x-tenant-id"]?: string | null };
};

type UsersProbe =
  | { ok: true; status: number; length: number }
  | { ok: false; status?: number; error: string };

export default function AccessControlPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [openAdd, setOpenAdd] = useState(false);

  // 👇 reactive current user (SSR-safe)
  const [cu, setCu] = useState<CurrentUser | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => setCu(getCurrentUser());
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const canCreateUser = cu?.role === "ADMIN";

  // ✅ tenant presence + auto-seed from currentUser if missing
  const [hasTenant, setHasTenant] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ensureTenant = () => {
      const existing =
        localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");

      if (!existing) {
        // seed from currentUser (supports multi-tenant and single-tenant)
        const user = getCurrentUser();
        const fallback =
          (Array.isArray(user?.tenants) && user.tenants.length ? user.tenants[0] : undefined) ??
          user?.tenantId ??
          null;

        if (fallback != null) {
          const t = String(fallback);
          localStorage.setItem("activeTenantId", t); // canonical
          localStorage.setItem("tenantId", t);       // legacy (some modules still read this)
        }
      }

      const now =
        localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
      setHasTenant(!!now);
    };

    // run once on mount and whenever user changes (after login)
    ensureTenant();

    // keep in sync with other tabs / topbar updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === "activeTenantId" || e.key === "tenantId" || e.key === "currentUser") {
        ensureTenant();
        // if tenant changed, also refresh local user snapshot
        setCu(getCurrentUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [cu?.id]); // re-evaluate when logged-in user changes

  // 🔍 Inline diagnostic panel
  const [debugOpen, setDebugOpen] = useState(false);
  const [tokenShort, setTokenShort] = useState<string | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [whoami, setWhoami] = useState<WhoAmI | null>(null);
  const [probe, setProbe] = useState<UsersProbe | null>(null);
  const [diagMsg, setDiagMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    setDiagMsg(null);
    try {
      // snapshot LS
      const t = localStorage.getItem("token");
      const tid =
        localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
      setTokenShort(t ? `${t.slice(0, 16)}…` : null);
      setActiveTenantId(tid ?? null);

      // 1) whoami (if your _debug endpoint exists)
      let who: WhoAmI | null = null;
      try {
        const { data } = await http.get("/_debug/whoami"); // will include auth + x-tenant-id via interceptor
        who = data;
      } catch (e: any) {
        // gracefully ignore if 404
        who = null;
      }
      setWhoami(who);

      // 2) users probe with explicit x-tenant-id (even if interceptor misses)
      let usersRes: UsersProbe;
      try {
        const { data, status } = await http.get("/users", {
          headers: tid ? { "x-tenant-id": tid } : {},
        });
        const length = Array.isArray(data) ? data.length : 0;
        usersRes = { ok: true, status, length };
      } catch (e: any) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Request failed";
        usersRes = { ok: false, status, error: msg };
      }
      setProbe(usersRes);

      // 3) quick reasoning
      if (!t) {
        setDiagMsg("Missing JWT token in localStorage → login again.");
      } else if (!tid) {
        setDiagMsg("Missing activeTenantId → select/seed tenant (Topbar/login).");
      } else if (usersRes && !usersRes.ok && usersRes.status === 403) {
        setDiagMsg(`403 from /users → tenant mismatch or not allowed for tenant ${tid}.`);
      } else if (usersRes && usersRes.ok && usersRes.length === 0) {
        setDiagMsg(`API returned empty list for tenant ${tid}. Check DB rows for this tenant.`);
      } else {
        setDiagMsg("Looks OK — if UI still empty, check mapping/rendering.");
      }
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    // auto-run once when page opens (helpful)
    runDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Inline banner if something obvious is wrong */}
        {diagMsg && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 text-amber-900 px-3 py-2 text-sm flex items-center gap-2">
            <Bug size={16} /> {diagMsg}
            <button
              onClick={runDiagnostics}
              className="ml-auto text-xs underline hover:opacity-80"
              disabled={running}
            >
              {running ? "Rechecking…" : "Re-run checks"}
            </button>
          </div>
        )}

        {/* Toolbar (blended like customers) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Access Control
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Roles &amp; per-user permission overrides (tenant-scoped)
              </p>
            </div>
          </div>

          {tab === "users" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDebugOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium
                           bg-white/70 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-white"
              >
                <Bug size={14} /> {debugOpen ? "Hide Debug" : "Show Debug"}
              </button>

              <button
                onClick={() => {
                  if (!hasTenant) return alert("Select a tenant first.");
                  if (!canCreateUser) return alert("Only ADMIN can add users.");
                  setOpenAdd(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white
                           bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                           shadow-sm active:scale-[0.98] disabled:opacity-50"
                disabled={!hasTenant || !canCreateUser}
                title={!hasTenant ? "Select a tenant first" : !canCreateUser ? "Only ADMIN can add users" : "Add staff"}
              >
                + Add User
              </button>
            </div>
          )}
        </div>

        {/* Debug panel content */}
        {debugOpen && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-3 text-xs space-y-2">
            <div className="flex flex-wrap gap-4">
              <div>token: <code>{tokenShort ?? "null"}</code></div>
              <div>activeTenantId: <code>{activeTenantId ?? "null"}</code></div>
              <div>user.role: <code>{cu?.role ?? "null"}</code></div>
              <button
                onClick={runDiagnostics}
                className="ml-auto rounded-lg px-2 py-1 ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                disabled={running}
              >
                {running ? "Re-run…" : "Re-run diagnostics"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <DebugBlock title="_debug/whoami (if enabled)">
                <pre className="whitespace-pre-wrap break-all">
                  {whoami ? JSON.stringify(whoami, null, 2) : "—"}
                </pre>
              </DebugBlock>
              <DebugBlock title="GET /users probe">
                <pre className="whitespace-pre-wrap break-all">
                  {probe
                    ? JSON.stringify(probe, null, 2)
                    : "—"}
                </pre>
              </DebugBlock>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <Tab active={tab === "users"} onClick={() => setTab("users")}>Users</Tab>
          <Tab active={tab === "roles"} onClick={() => setTab("roles")}>Roles</Tab>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden p-4">
          {tab === "roles" ? (
            <RoleMatrix
              roles={["ADMIN","MANAGER","RECEPTIONIST","CASHIER","WAITER","HOUSEKEEPING"]}
              allPermissions={[
                "dashboard.view",
                "customers.read","customers.write",
                "inventory.read","inventory.manage",
                "bars.read","bars.manage",
                "hotels.read","hotels.manage",
                "pos.use",
                "reports.view","reports.manage",
                "suppliers.read","suppliers.manage",
                "bookings.read","bookings.manage",
                "invoices.read","invoices.manage",
              ]}
              rolePermissions={{
                ADMIN: [
                  "dashboard.view","customers.read","customers.write","inventory.read","inventory.manage",
                  "bars.read","bars.manage","hotels.read","hotels.manage","pos.use","reports.view","reports.manage",
                  "suppliers.read","suppliers.manage","bookings.read","bookings.manage","invoices.read","invoices.manage",
                ],
                MANAGER: [
                  "dashboard.view","reports.view","customers.read","customers.write","inventory.read","inventory.manage",
                  "bookings.read","bookings.manage","invoices.read","invoices.manage",
                ],
                RECEPTIONIST: ["dashboard.view","bookings.read","bookings.manage","customers.read","invoices.read"],
                CASHIER: ["dashboard.view","pos.use","invoices.read","invoices.manage"],
                WAITER: ["dashboard.view","pos.use"],
                HOUSEKEEPING: ["dashboard.view","hotels.read"],
              }}
              editable={false}
            />
          ) : (
            <UserOverrides />
          )}
        </div>

        {/* Modal */}
        <AddUserModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onCreated={() => setOpenAdd(false)}
        />
      </div>
    </MainLayout>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 ${
        active
          ? "border-indigo-600 text-indigo-700 dark:text-indigo-300 font-medium"
          : "border-transparent text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function DebugBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
      <div className="text-[11px] font-semibold mb-1 opacity-70">{title}</div>
      {children}
    </div>
  );
}
