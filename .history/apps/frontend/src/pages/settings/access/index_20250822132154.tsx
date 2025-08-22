import { useEffect, useState } from "react";
import RoleMatrix from "@/components/settings/access/RoleMatrix";
import UserOverrides from "@/components/settings/access/UserOverrides";
import AddUserModal from "@/components/settings/access/AddUserModal";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import MainLayout from "@/layouts/MainLayout";
import { ShieldCheck } from "lucide-react";

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

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
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
          )}
        </div>

        {/* Tabs (like customers’ filters/sort bar) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <Tab active={tab === "users"} onClick={() => setTab("users")}>Users</Tab>
          <Tab active={tab === "roles"} onClick={() => setTab("roles")}>Roles</Tab>
        </div>

        {/* Content Card (glass like customers table card) */}
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
