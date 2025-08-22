import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BedDouble,
  Wine,
  Boxes,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

/* ------------------------------ LS helpers ------------------------------ */
function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function useLS<T>(key: string, fallback: T): T {
  const [val, setVal] = useState<T>(() => readJSON<T>(key, fallback));
  useEffect(() => {
    const refresh = () => setVal(readJSON<T>(key, fallback));

    // Cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === key) refresh();
    };
    window.addEventListener("storage", onStorage);

    // Same-tab updates: listen to a custom event our app dispatches after perm changes
    const onPermsUpdated = () => refresh();
    window.addEventListener("permissions:updated", onPermsUpdated as any);

    // Soft polling as a safety net (rare edge cases)
    const id = setInterval(refresh, 500);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("permissions:updated", onPermsUpdated as any);
      clearInterval(id);
    };
  }, [key, fallback]);
  return val;
}
function isAdminRole(role: string | null): boolean {
  if (!role) return false;
  return String(role).toUpperCase() === "ADMIN";
}
function canAny(perms: Set<string>, required?: string[]) {
  if (!required || required.length === 0) return true;
  for (const k of required) if (perms.has(k)) return true;
  return false;
}

/* ------------------------------ Nav schema ------------------------------ */
/* ANY semantics for required: if user has ANY of the keys, show/enable. */
type NavItem = { name: string; path: string; icon: any; required?: string[] };

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, required: ["dashboard.view"] },
  { name: "Customers", path: "/customers", icon: Users, required: ["customers.read", "customers.write"] },
  { name: "Bookings", path: "/bookings", icon: Calendar, required: ["bookings.read"] },
  { name: "Rooms", path: "/rooms", icon: BedDouble, required: ["hotels.read"] },
  // choose per RBAC (either pos.use or bars.read will allow)
  { name: "Bar / POS", path: "/bar", icon: Wine, required: ["pos.use", "bars.read"] },
  { name: "Inventory", path: "/inventory", icon: Boxes, required: ["inventory.read"] },
  { name: "Reports", path: "/reports", icon: BarChart2, required: ["reports.view"] },
  // strict key (matches backend)
  { name: "Access Control", path: "/settings/access", icon: Settings, required: ["settings.access.manage"] },
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();
  const role = useLS<any>("currentUser", null)?.role ?? null;
  const permsArr = useLS<string[]>("permissions", []);
  const perms = new Set(permsArr || []);
  const isAdmin = isAdminRole(role);

  // For non-admins, show ONLY allowed items (cleaner UX).
  const visible = isAdmin ? NAV_ITEMS : NAV_ITEMS.filter((it) => canAny(perms, it.required));

  return (
    <>
      {/* Overlay (mobile) */}
      <div
        onClick={() => isOpen && toggle()}
        className={clsx(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden transition-opacity",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 256 : 80 }}
        transition={{ duration: 0.22 }}
        className={clsx(
          // Mobile: fixed (with overlay). Desktop: sticky so it “adjusts” with page length.
          "fixed md:sticky top-0 md:top-0 z-40 md:z-auto h-screen md:h-screen",
          // Allow the sidebar itself to scroll vertically when content is tall
          "overflow-y-auto",
          // Visuals
          "md:min-h-0 flex flex-col text-white",
          "bg-gradient-to-b from-sky-500 via-indigo-500 to-fuchsia-500 dark:from-gray-900 dark:to-gray-800",
          "shadow-lg",
          "before:content-[''] before:absolute before:inset-0 before:pointer-events-none",
          "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,rgba(255,255,255,0)_60%)]",
          "before:opacity-60 before:mix-blend-soft-light"
        )}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="bg-white text-indigo-700 p-2 rounded-lg font-bold text-lg shadow-md select-none">
              BS
            </div>
            {isOpen && <span className="text-xl font-bold tracking-wide">CRM Dashboard</span>}
          </div>
          <button
            onClick={toggle}
            className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg
                       bg-white/10 hover:bg-white/20 border border-white/20 transition"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 px-2">
          <ul className="space-y-1">
            {visible.map((item) => {
              const isActive =
                router.pathname === item.path ||
                router.pathname.startsWith(item.path + "/");
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    data-tooltip-id={`tip-${item.name}`}
                    className={clsx(
                      "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white/25 backdrop-blur-sm shadow-sm scale-[1.02] border border-white/30"
                        : "hover:bg-white/10 border border-transparent"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span className="truncate">{item.name}</span>}
                  </Link>

                  {!isOpen && (
                    <Tooltip
                      id={`tip-${item.name}`}
                      place="right"
                      style={{
                        backgroundColor: "#0f172a",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                      }}
                    >
                      {item.name}
                    </Tooltip>
                  )}
                </li>
              );
            })}

            {/* Optional: show locked items (disabled) for clarity (ADMIN sees all anyway) */}
            {!isAdmin &&
              NAV_ITEMS.filter((it) => !canAny(perms, it.required)).map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path + "-locked"}>
                    <div
                      aria-disabled
                      data-tooltip-id={`tip-${item.name}-locked`}
                      className={clsx(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                        "opacity-60 cursor-not-allowed border border-transparent"
                      )}
                    >
                      <LockKeyhole className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isOpen && (
                      <Tooltip
                        id={`tip-${item.name}-locked`}
                        place="right"
                        style={{
                          backgroundColor: "#0f172a",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                        }}
                      >
                        {item.name} (no access)
                      </Tooltip>
                    )}
                  </li>
                );
              })}

            {/* Empty state when nothing is visible for the user */}
            {!isAdmin && visible.length === 0 && (
              <li className="px-3 py-2 text-xs opacity-80">
                No modules available for your access level.
              </li>
            )}
          </ul>
        </nav>

        {/* Footer actions — keep this Settings button as you prefer */}
        <div className="p-3 border-t border-white/20">
          <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                             bg-white/15 hover:bg-white/25 border border-white/20 text-white transition">
            <Settings className="w-4 h-4" />
            {isOpen && <span>Settings</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
