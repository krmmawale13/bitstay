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
  ShieldCheck,
  FileText,
  Bell,
  Workflow,
  Folder,
  Building2,
  Store,
  ListChecks,
  ChevronDown,
  ChevronRight,
  Pin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useEffect, useMemo, useState } from "react";

/** PROPS */
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
function writeJSON<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}
function useLS<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => readJSON<T>(key, fallback));
  useEffect(() => {
    const refresh = () => setVal(readJSON<T>(key, fallback));
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key === key) refresh(); };
    window.addEventListener("storage", onStorage);
    const onPermsUpdated = () => refresh();
    window.addEventListener("permissions:updated", onPermsUpdated as any);
    const id = setInterval(refresh, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("permissions:updated", onPermsUpdated as any);
      clearInterval(id);
    };
  }, [key, fallback]);
  const setter = (v: T) => { setVal(v); writeJSON(key, v); };
  return [val, setter];
}
const isAdminRole = (role: string | null) => !!role && String(role).toUpperCase() === "ADMIN";
const canAny = (perms: Set<string>, required?: string[]) =>
  !required?.length || required.some((k) => perms.has(k));

/* ------------------------------ Feature flags ------------------------------ */
/** Expect LS shape: { modules: { inventory: true, bars: true, invoicing: true, ... } } */
function useFeatureFlags() {
  const [flags] = useLS<{ modules?: Record<string, boolean> }>("featureFlags", { modules: {} });
  return flags?.modules || {};
}

/* ------------------------------ Nav schema ------------------------------ */
type NavEntry = {
  name: string;
  path: string;
  icon: any;
  required?: string[];
  flag?: string; // feature-flag key
};
type NavSection = {
  key: string;
  title: string;
  icon: any;
  items: NavEntry[];
};

const SECTIONS: NavSection[] = [
  {
    key: "frontdesk",
    title: "Front Desk",
    icon: Building2,
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, required: ["dashboard.view"] },
      { name: "Bookings", path: "/bookings", icon: Calendar, required: ["bookings.read"] },
      { name: "Customers", path: "/customers", icon: Users, required: ["customers.read", "customers.write"] },
      { name: "Property", path: "/rooms", icon: BedDouble, required: ["hotels.read"], flag: "property" },
    ],
  },
  {
    key: "salespos",
    title: "Sales & POS",
    icon: Store,
    items: [
      { name: "POS Tables", path: "/pos/tables", icon: ListChecks, required: ["bars.read"], flag: "bars" },
      { name: "F&B Masters", path: "/pos/masters", icon: Wine, required: ["bars.manage", "pos.use"], flag: "fbmasters" },
      { name: "POS Orders & KOT", path: "/pos/orders", icon: Wine, required: ["pos.use"], flag: "pos" },
      { name: "Sales & Invoicing", path: "/invoices", icon: FileText, required: ["invoices.read"], flag: "invoicing" },
    ],
  },
  {
    key: "backoffice",
    title: "Back Office",
    icon: Boxes,
    items: [
      { name: "Inventory", path: "/inventory", icon: Boxes, required: ["inventory.read"], flag: "inventory" },
      { name: "Suppliers & Purchasing", path: "/suppliers", icon: Store, required: ["suppliers.read"], flag: "suppliers" },
    ],
  },
  {
    key: "compliance",
    title: "Compliance & BI",
    icon: BarChart2,
    items: [
      { name: "Reports & Analytics", path: "/reports", icon: BarChart2, required: ["reports.view"], flag: "reports" },
      { name: "Compliance & GST", path: "/compliance/gst", icon: ShieldCheck, required: ["reports.manage", "invoices.manage"], flag: "gst" },
      { name: "Excise", path: "/compliance/excise", icon: ShieldCheck, required: ["inventory.manage", "reports.manage"], flag: "excise" },
    ],
  },
  {
    key: "system",
    title: "System",
    icon: Settings,
    items: [
      { name: "Notifications & Schedules", path: "/settings/notifications", icon: Bell, required: ["dashboard.view"], flag: "notifications" },
      { name: "Approvals & Audit", path: "/settings/approvals", icon: Workflow, required: ["dashboard.view"], flag: "approvals" },
      { name: "File Storage", path: "/files", icon: Folder, required: ["dashboard.view"], flag: "files" },
      { name: "Reference Data", path: "/settings/reference", icon: FileText, required: ["reference.manage"], flag: "reference" },
      { name: "Access Control", path: "/settings/access", icon: Settings, required: ["settings.access.manage"] },
    ],
  },
];

function flattenSections(sections: NavSection[]) {
  return sections.flatMap((s) => s.items.map((i) => ({ section: s.key, ...i })));
}

/* ------------------------------ Component ------------------------------ */
export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();
  const role = readJSON<any>("currentUser", null)?.role ?? null;
  const permsArr = readJSON<string[]>("permissions", []);
  const perms = new Set(permsArr || []);
  const isAdmin = isAdminRole(role);
  const flags = useFeatureFlags();

  // Pins & Recents & Section state
  const [pins, setPins] = useLS<string[]>("nav.pins", []);
  const [recents, setRecents] = useLS<string[]>("nav.recent", []);
  const [openSections, setOpenSections] = useLS<string[]>("nav.openSections", ["frontdesk", "salespos"]);

  // RBAC + feature flags prune
  const pruned = useMemo(() => {
    const visibleSections: NavSection[] = [];
    for (const sec of SECTIONS) {
      const items = sec.items.filter((it) => {
        const byPerm = isAdmin || canAny(perms, it.required);
        const byFlag = it.flag ? flags[it.flag] !== false : true; // default ON unless explicitly false
        return byPerm && byFlag;
      });
      if (items.length) visibleSections.push({ ...sec, items });
    }
    return visibleSections;
  }, [isAdmin, perms, flags]);

  // Recents
  useEffect(() => {
    const all = flattenSections(SECTIONS);
    const match = all.find((i) => router.pathname === i.path || router.pathname.startsWith(i.path + "/"));
    if (!match) return;
    setRecents((prev) => [match.path, ...prev.filter((p) => p !== match.path)].slice(0, 3));
  }, [router.pathname, setRecents]);

  const isPinned = (path: string) => pins.includes(path);
  const togglePin = (path: string) =>
    setPins(isPinned(path) ? pins.filter((p) => p !== path) : [...pins, path].slice(0, 5));
  const toggleSectionOpen = (key: string) =>
    setOpenSections(openSections.includes(key) ? openSections.filter((k) => k !== key) : [...openSections, key]);

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
          "fixed md:sticky top-0 md:top-0 z-40 md:z-auto h-screen md:h-screen",
          "overflow-y-auto",
          "md:min-h-0 flex flex-col text-white",
          "bg-gradient-to-b from-sky-500 via-indigo-500 to-fuchsia-500 dark:from-gray-900 dark:to-gray-800",
          "shadow-lg",
          "before:content-[''] before:absolute before:inset-0 before:pointer-events-none",
          "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,rgba(255,255,255,0)_60%)]",
          "before:opacity-60 before:mix-blend-soft-light"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="bg-white text-indigo-700 p-2 rounded-lg font-bold text-lg shadow-md select-none">BS</div>
            {isOpen && <span className="text-xl font-bold tracking-wide">CRM Dashboard</span>}
          </div>
          <button
            onClick={toggle}
            className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <ChevronRight size={18} className="rotate-180" /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Pins & Recents */}
        <div className="px-3 pt-3">
          {!!pins.length && (
            <div className="mb-2">
              {isOpen && <div className="text-[10px] uppercase tracking-wider opacity-70 px-1 mb-1">Pinned</div>}
              <div className="flex gap-2 flex-wrap">
                {pins.map((p) => (
                  <Link
                    key={p}
                    href={p}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-xs border border-white/20"
                  >
                    <Pin className="w-3 h-3" />
                    {isOpen && <span className="truncate max-w-[120px]">{p}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!!recents.length && (
            <div className="mb-2">
              {isOpen && <div className="text-[10px] uppercase tracking-wider opacity-70 px-1 mb-1">Recent</div>}
              <div className="flex gap-2 flex-wrap">
                {recents.map((p) => (
                  <Link
                    key={p}
                    href={p}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs border border-white/10"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    {isOpen && <span className="truncate max-w-[140px]">{p}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sections */}
        <nav className="mt-2 flex-1 px-2">
          <ul className="space-y-2">
            {pruned.map((section) => {
              const open = openSections.includes(section.key);
              return (
                <li key={section.key}>
                  <button
                    onClick={() => toggleSectionOpen(section.key)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition"
                    )}
                    aria-expanded={open}
                  >
                    <section.icon className="w-4 h-4" />
                    {isOpen && <span className="flex-1 text-sm font-medium">{section.title}</span>}
                    {isOpen && (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-1 ml-1 pl-2 border-l border-white/10 space-y-1 overflow-hidden"
                      >
                        {section.items.map((item) => {
                          const isActive =
                            router.pathname === item.path || router.pathname.startsWith(item.path + "/");
                          const Icon = item.icon;
                          const pinned = isPinned(item.path);
                          return (
                            <li key={item.path} className="group flex items-center">
                              <Link
                                href={item.path}
                                className={clsx(
                                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200",
                                  isActive ? "bg-white/25 border-white/30" : "bg-white/5 hover:bg-white/10 border-white/10"
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                {isOpen && <span className="truncate text-sm">{item.name}</span>}
                              </Link>
                              {isOpen && (
                                <button
                                  onClick={() => togglePin(item.path)}
                                  className={clsx(
                                    "ml-2 p-1 rounded-md border text-xs",
                                    pinned ? "bg-white/30 border-white/40" : "bg-white/10 hover:bg-white/20 border-white/20"
                                  )}
                                  aria-label={pinned ? "Unpin" : "Pin"}
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/20">
          <Link
            href="/settings"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition"
          >
            <Settings className="w-4 h-4" />
            {isOpen && <span>Settings</span>}
          </Link>
        </div>
      </motion.aside>
    </>
  );
}
