// apps/frontend/src/components/Sidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  BedDouble,
  Building2,
  Wine,
  Boxes,
  BarChart2,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShoppingCart,
  Truck,
  FileText,
  UtensilsCrossed,
  ReceiptText,
  ScrollText,
  FolderOpen,
  Bell,
  Stamp,
  Database,
  LockKeyhole,
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MENU, type MenuItem } from "@/config/menu.config";
import { canAny, type PermissionKey } from "@/lib/acl";

/* --------------------------------- Props -------------------------------- */
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

function useLocalStorageWatch<T>(key: string, fallback: T): T {
  const [val, setVal] = useState<T>(() => readJSON<T>(key, fallback));

  useEffect(() => {
    const refresh = () => setVal(readJSON<T>(key, fallback));

    // Cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === key) refresh();
    };
    window.addEventListener("storage", onStorage);

    // Same-tab custom events you already emit after login/perm updates
    const onPermsUpdated = () => refresh();
    const onMetadataUpdated = () => refresh();
    window.addEventListener("permissions:updated", onPermsUpdated as any);
    window.addEventListener("metadata:updated", onMetadataUpdated as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("permissions:updated", onPermsUpdated as any);
      window.removeEventListener("metadata:updated", onMetadataUpdated as any);
    };
  }, [key, fallback]);

  return val;
}

/* --------------------------------- Icons -------------------------------- */
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  BedDouble,
  Building2,
  Wine,
  Boxes,
  BarChart2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  FileText,
  UtensilsCrossed,
  ReceiptText,
  ScrollText,
  FolderOpen,
  Bell,
  Stamp,
  Database,
  // Aliases (fallbacks)
  Settings: SettingsIcon,
};

/* ------------------------------ RBAC helpers ---------------------------- */
function isAdminRole(role: string | null): boolean {
  if (!role) return false;
  return String(role).toUpperCase() === "ADMIN";
}

/* ------------------------------ Active utils ---------------------------- */
function isPathActive(current: string, href?: string): boolean {
  if (!href) return false;
  if (current === href) return true;
  return current.startsWith(href + "/");
}

/* ---------------------------- Sidebar Component ------------------------- */
export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();

  // Current user & perms from localStorage (kept in sync via events/storage)
  const currentUser = useLocalStorageWatch<any>("currentUser", null);
  const role: string | null = currentUser?.role ?? null;
  const isAdmin = isAdminRole(role);

  const permsArr = useLocalStorageWatch<PermissionKey[]>("permissions", []);
  const perms = useMemo(() => new Set(permsArr || []), [permsArr]);

  // Collapsible buckets: persist which groups are open
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    readJSON<string[]>("sidebar:openGroups", ["Front Desk"]) // default open
  );

  // Keep a bucket open when any child matches current route
  useEffect(() => {
    const mustBeOpen: string[] = [];
    MENU.forEach((bucket) => {
      if (!bucket.children || bucket.children.length === 0) return;
      const anyActive = bucket.children.some((c) => isPathActive(router.asPath, c.href));
      if (anyActive && !mustBeOpen.includes(bucket.label)) mustBeOpen.push(bucket.label);
    });
    if (mustBeOpen.length > 0) {
      setOpenGroups((prev) => {
        const next = Array.from(new Set([...prev, ...mustBeOpen]));
        if (typeof window !== "undefined") {
          localStorage.setItem("sidebar:openGroups", JSON.stringify(next));
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups((prev) => {
      const isOpenNow = prev.includes(label);
      const next = isOpenNow ? prev.filter((l) => l !== label) : [...prev, label];
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar:openGroups", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // RBAC filter for non-admin users (ANY semantics)
  const gatedMenu = useMemo(() => {
    if (isAdmin) return MENU;
    return MENU.map((bucket) => {
      const children = (bucket.children || []).filter((child) =>
        canAny(perms, child.required)
      );
      return { ...bucket, children };
    }).filter((b) => (b.children || []).length > 0);
  }, [isAdmin, perms]);

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
          "shadow-lg relative",
          "before:content-[''] before:absolute before:inset-0 before:pointer-events-none",
          "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,rgba(255,255,255,0)_60%)]",
          "before:opacity-60 before:mix-blend-soft-light"
        )}
        aria-label="Main sidebar"
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
            className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-3 flex-1 px-2">
          <ul className="space-y-2">
            {gatedMenu.map((bucket) => {
              const BucketIcon = bucket.icon ? ICON_MAP[bucket.icon] : undefined;
              const isGroupOpen = openGroups.includes(bucket.label);
              const children = bucket.children || [];

              return (
                <li key={bucket.label} className="select-none">
                  {/* Bucket header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(bucket.label)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      "bg-white/5 hover:bg-white/10 border border-white/10",
                      isOpen ? "justify-start" : "justify-center"
                    )}
                    aria-expanded={isGroupOpen}
                    aria-controls={`group-${bucket.label}`}
                  >
                    {BucketIcon ? <BucketIcon className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    {isOpen && (
                      <span className="truncate font-semibold tracking-wide">{bucket.label}</span>
                    )}
                    {isOpen && (
                      <span className={clsx("ml-auto transition-transform", isGroupOpen ? "rotate-0" : "-rotate-90")}>
                        <ChevronLeft size={16} />
                      </span>
                    )}
                  </button>

                  {/* Children */}
                  <ul
                    id={`group-${bucket.label}`}
                    className={clsx(
                      "mt-1 pl-0 space-y-1",
                      isGroupOpen ? "block" : isOpen ? "hidden" : "hidden"
                    )}
                  >
                    {children.map((item) => {
                      const Icon = item.icon ? ICON_MAP[item.icon] : undefined;
                      const active = isPathActive(router.asPath, item.href);

                      // Compact tooltip id
                      const tipId = `tip-${bucket.label}-${item.label}`;

                      return (
                        <li key={bucket.label + "-" + item.label}>
                          <Link
                            href={item.href || "#"}
                            data-tooltip-id={!isOpen ? tipId : undefined}
                            aria-current={active ? "page" : undefined}
                            className={clsx(
                              "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                              active
                                ? "bg-white/25 backdrop-blur-sm shadow-sm scale-[1.02] border border-white/30"
                                : "hover:bg-white/10 border border-transparent",
                              isOpen ? "justify-start" : "justify-center"
                            )}
                          >
                            {Icon ? <Icon className="w-5 h-5 flex-shrink-0" /> : <FolderOpen className="w-5 h-5" />}
                            {isOpen && <span className="truncate">{item.label}</span>}
                          </Link>

                          {/* Compact tooltip */}
                          {!isOpen && (
                            <Tooltip
                              id={tipId}
                              place="right"
                              style={{
                                backgroundColor: "#0f172a",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "0.875rem",
                              }}
                            >
                              {item.label}
                            </Tooltip>
                          )}
                        </li>
                      );
                    })}

                    {/* If a group becomes empty for non-admin, show a subtle hint (optional) */}
                    {!isAdmin && children.length === 0 && (
                      <li className="px-3 py-2 text-xs opacity-80 flex items-center gap-2">
                        <LockKeyhole className="w-4 h-4" />
                        {isOpen && <span>No access in this bucket</span>}
                      </li>
                    )}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/20">
          <button
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                       bg-white/15 hover:bg-white/25 border border-white/20 text-white transition"
          >
            <SettingsIcon className="w-4 h-4" />
            {isOpen && <span>Settings</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
