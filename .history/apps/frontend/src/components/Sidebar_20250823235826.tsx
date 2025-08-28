import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { MENU } from "@/config/menu.config";

type PermissionKey = string;

type SidebarProps = {
  isOpen: boolean;
  toggle: () => void;
  /** Optional: parent can pass a pre-filtered menu (RBAC/flags). Defaults to MENU. */
  menu?: typeof MENU;
  /** Optional: if provided, Sidebar will do a simple ANY-perm check on items. */
  permissions?: PermissionKey[];
  role?: string | null;
};

/** map string ("LayoutDashboard") from config → lucide-react icon component */
function getIcon(name?: string) {
  if (!name) return Icons.Circle;
  const Icon = (Icons as any)[name];
  return Icon || Icons.Circle;
}

/** pure RBAC ANY check (no side effects) */
function allow(perms: Set<string> | null, required?: PermissionKey[], isAdmin?: boolean) {
  if (isAdmin) return true;
  if (!required || required.length === 0) return true;
  if (!perms) return false;
  return required.some((k) => perms.has(k));
}

/** flattens a grouped menu into leaf items for active route highlight, if needed */
function flatten(menu: typeof MENU) {
  const out: { label: string; href: string }[] = [];
  for (const s of menu) {
    if (s.children?.length) {
      for (const it of s.children) out.push({ label: it.label, href: it.href });
    } else {
      out.push({ label: s.label, href: s.href });
    }
  }
  return out;
}

export default function Sidebar({
  isOpen,
  toggle,
  menu,
  permissions,
  role,
}: SidebarProps) {
  const router = useRouter();
  const isAdmin = (role || "").toUpperCase() === "ADMIN";
  const perms = permissions ? new Set(permissions) : null;

  // use provided menu or global MENU
  const source = menu ?? MENU;

  // simple, pure filtering (optional): if permissions provided, prune items; else show all
  const filtered = source
    .map((section) => {
      const children = section.children?.filter((it) => allow(perms, it.required, isAdmin)) ?? [];
      // if section has explicit href but no children, treat it as a leaf
      if (!section.children || section.children.length === 0) {
        return allow(perms, section.required, isAdmin) ? section : null;
      }
      return children.length ? { ...section, children } : null;
    })
    .filter(Boolean) as typeof MENU;

  const itemsFlat = flatten(filtered);

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
          "overflow-y-auto md:min-h-0 flex flex-col text-white",
          "bg-gradient-to-b from-sky-500 via-indigo-500 to-fuchsia-500 dark:from-gray-900 dark:to-gray-800",
          "shadow-lg relative",
          "before:content-[''] before:absolute before:inset-0 before:pointer-events-none",
          "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,rgba(255,255,255,0)_60%)]",
          "before:opacity-60 before:mix-blend-soft-light"
        )}
      >
        {/* Brand + toggle */}
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
            <Icons.ChevronRight size={18} className={clsx(isOpen && "rotate-180")} />
          </button>
        </div>

        {/* Sections */}
        <nav className="mt-2 flex-1 px-2">
          <ul className="space-y-2">
            {filtered.map((section) => {
              const SectionIcon = getIcon(section.icon);
              const hasChildren = Array.isArray(section.children) && section.children.length > 0;

              return (
                <li key={section.label}>
                  {/* Section header (non-interactive; always expanded to keep it simple & safe) */}
                  <div
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-white/15 bg-white/5",
                      "text-white/90"
                    )}
                  >
                    <SectionIcon className="w-4 h-4" />
                    {isOpen && <span className="flex-1 text-sm font-medium">{section.label}</span>}
                  </div>

                  {/* Items */}
                  {hasChildren ? (
                    <ul className="mt-1 ml-1 pl-2 border-l border-white/10 space-y-1">
                      {section.children!.map((item) => {
                        const Icon = getIcon(item.icon);
                        const isActive =
                          router.pathname === item.href ||
                          router.pathname.startsWith(item.href + "/");
                        return (
                          <li key={item.label}>
                            <Link
                              href={item.href}
                              className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200",
                                isActive
                                  ? "bg-white/25 border-white/30"
                                  : "bg-white/5 hover:bg-white/10 border-white/10"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              {isOpen && <span className="truncate text-sm">{item.label}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    // leaf (rare): when section itself is a page
                    <div className="mt-1 ml-1 pl-2">
                      <Link
                        href={section.href}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200 bg-white/5 hover:bg-white/10 border-white/10"
                        )}
                      >
                        <SectionIcon className="w-4 h-4" />
                        {isOpen && <span className="truncate text-sm">{section.label}</span>}
                      </Link>
                    </div>
                  )}
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
            <Icons.Settings className="w-4 h-4" />
            {isOpen && <span>Settings</span>}
          </Link>
        </div>
      </motion.aside>
    </>
  );
}
