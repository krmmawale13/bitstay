import { useEffect, useState } from "react";
import RoleMatrix from "@/components/settings/access/RoleMatrix";
import UserOverrides from "@/components/settings/access/UserOverrides";
import AddUserModal from "@/components/settings/access/AddUserModal";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import MainLayout from "@/layouts/MainLayout";
import { ShieldCheck } from "lucide-react";
import http from "@/lib/http";
import { toPermSet } from "@/lib/acl";

const REQUIRED = "settings.access.manage";

export default function AccessControlPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [openAdd, setOpenAdd] = useState(false);

  // current user (SSR-safe)
  const [cu, setCu] = useState<CurrentUser | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => setCu(getCurrentUser());
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // read permissions from LS
  const [hasAccess, setHasAccess] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const compute = () => {
      const raw = localStorage.getItem("permissions");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setHasAccess(toPermSet(arr).has(REQUIRED));
    };
    compute();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "permissions") compute();
    };
    window.addEventListener("storage", onStorage);
    // also respond to our custom refresh event
    const onCustom = () => compute();
    window.addEventListener("permissions:updated", onCustom as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("permissions:updated", onCustom as any);
    };
  }, []);

  const canCreateUser = cu?.role === "ADMIN";

  // tenant presence + auto-seed
  const [hasTenant, setHasTenant] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ensureTenant = () => {
      const existing =
        localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");

      if (!existing) {
        const user = getCurrentUser();
        const fallback =
          (Array.isArray(user?.tenants) && user.tenants.length ? user.tenants[0] : undefined) ??
          (user as any)?.tenantId ??
          null;

        if (fallback != null) {
          const t = String(fallback);
          localStorage.setItem("activeTenantId", t);
          localStorage.setItem("tenantId", t);
          window.__toast?.push?.({
            type: "info",
            message: "Tenant selected",
            description: `Active tenant set to #${t}`,
          });
        }
      }

      const now =
        localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId");
      setHasTenant(!!now);
    };

    ensureTenant();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "activeTenantId" || e.key === "tenantId" || e.key === "currentUser") {
        ensureTenant();
        setCu(getCurrentUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [cu?.id]);

  const handleAddClick = () => {
    if (!hasTenant) {
      window.__toast?.push?.({
        type: "info",
        message: "Select a tenant first",
        description: "Choose the active tenant from the top bar and try again.",
      });
      return;
    }
    if (!canCreateUser) {
      window.__toast?.push?.({
        type: "error",
        message: "Access denied",
        description: "Only ADMIN can add users.",
      });
      return;
    }
    setOpenAdd(true);
  };

  // refresh perms after saving overrides for SELF
  async function refreshPermsIfSelf(editedUserId: number) {
    try {
      if (cu?.id === editedUserId) {
        const res = await http.get("/auth/permissions"); // interceptor sends x-tenant-id
        const perms: string[] = res.data?.permissions ?? [];
        localStorage.setItem("permissions", JSON.stringify(perms));
        window.dispatchEvent(new Event("permissions:updated"));
      }
    } catch (e) {
      // non-blocking
    }
  }

  // FRONTEND SOFT LOCK
  if (!hasAccess) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold mb-1">Access restricted</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You don’t have permission to manage Access Control.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Toolbar */}
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
              onClick={handleAddClick}
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

        {/* Steps */}
        <div className="rounded-xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 px-3 py-2 text-sm flex items-center gap-3">
          <span className="font-medium">Steps:</span>
          <span className="opacity-80">1) Pick a user</span>
          <span className="opacity-40">→</span>
          <span className="opacity-80">2) Edit exceptions (overrides)</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <Tab active={tab === "users"} onClick={() => setTab("users")}>Users</Tab>
          <Tab active={tab === "roles"} onClick={() => setTab("roles")}>Roles</Tab>
        </div>

        {/* Content */}
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
                // include strict key so UI mirrors backend
                "settings.access.manage",
              ]}
              rolePermissions={{
                ADMIN: [
                  "dashboard.view","customers.read","customers.write","inventory.read","inventory.manage",
                  "bars.read","bars.manage","hotels.read","hotels.manage","pos.use","reports.view","reports.manage",
                  "suppliers.read","suppliers.manage","bookings.read","bookings.manage","invoices.read","invoices.manage",
                  "settings.access.manage",
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
            // Pass a hook for self-edit refresh; harmless no-op if the component ignores it
            <UserOverrides onAfterSaveSelf={refreshPermsIfSelf} />
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
