// apps/frontend/src/components/Sidebar.tsx
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
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

// ✅ Top-nav: "Settings" removed, "Access Control" added
const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Bookings", path: "/bookings", icon: Calendar },
  { name: "Rooms", path: "/rooms", icon: BedDouble },
  { name: "Bar / POS", path: "/bar", icon: Wine },
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "Reports", path: "/reports", icon: BarChart2 },
  { name: "Access Control", path: "/settings/access", icon: Settings }, // ⬅️ new
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();

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
          "fixed md:static z-40 md:z-auto h-full md:min-h-screen flex flex-col text-white",
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
            {navItems.map((item) => {
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
