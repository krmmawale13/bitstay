// src/components/Sidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Bed,
  Wine,
  Package,
  BarChart3,
  Settings,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Bookings", path: "/bookings", icon: CalendarCheck },
  { name: "Rooms", path: "/rooms", icon: Bed },
  { name: "Bar / POS", path: "/bar", icon: Wine },
  { name: "Inventory", path: "/inventory", icon: Package },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={clsx(
        "bg-white dark:bg-gray-900 shadow-lg min-h-screen transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header */}
      <div
        onClick={toggle}
        className="p-4 flex items-center justify-center cursor-pointer border-b border-gray-200 dark:border-gray-700"
      >
        <span
          className={clsx(
            "font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600 tracking-wide text-lg",
            !isOpen && "hidden"
          )}
        >
          BitStay CRM
        </span>
        {!isOpen && (
          <span className="text-teal-500 font-bold text-xl">B</span>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors relative group",
                    isActive
                      ? "bg-teal-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-teal-800"
                  )}
                >
                  <Icon size={20} />
                  {isOpen && <span>{item.name}</span>}
                  {!isOpen && (
                    <span className="absolute left-full ml-2 bg-gray-800 text-white text-sm rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
