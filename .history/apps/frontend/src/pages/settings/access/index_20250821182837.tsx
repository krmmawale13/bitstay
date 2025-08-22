import { useState } from "react";
import RoleMatrix from "@/components/settings/access/RoleMatrix";
import UserOverrides from "@/components/settings/access/UserOverrides";
import AddUserModal from "@/components/settings/access/AddUserModal";
import { getCurrentUser } from "@/lib/auth";

export default function AccessControlPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [openAdd, setOpenAdd] = useState(false);

  const cu = getCurrentUser();
  const canCreateUser = cu?.role === "ADMIN";
  const hasTenant =
    typeof window !== "undefined" &&
    (localStorage.getItem("activeTenantId") || localStorage.getItem("tenantId"));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Access Control</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Roles & per-user permission overrides (tenant-scoped).
          </p>
        </div>
        {tab === "users" && (
          <button
            onClick={() => {
              if (!hasTenant) return alert("Select a tenant first.");
              if (!canCreateUser) return alert("Only ADMIN can add users.");
              setOpenAdd(true);
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            disabled={!hasTenant || !canCreateUser}
            title={!hasTenant ? "Select a tenant first" : !canCreateUser ? "Only ADMIN can add users" : "Add staff"}
          >
            + Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <Tab active={tab === "users"} onClick={() => setTab("users")}>Users</Tab>
        <Tab active={tab === "roles"} onClick={() => setTab("roles")}>Roles</Tab>
      </div>

      {/* Content */}
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

      {/* Modal */}
      <AddUserModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreated={() => setOpenAdd(false)}
      />
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 ${
        active ? "border-indigo-600 text-indigo-700 dark:text-indigo-300 font-medium"
               : "border-transparent text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
