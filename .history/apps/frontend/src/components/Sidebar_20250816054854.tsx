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
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Bookings", path: "/bookings", icon: Calendar },
  { name: "Rooms", path: "/rooms", icon: BedDouble },
  { name: "Bar / POS", path: "/bar", icon: Wine },
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "Reports", path: "/reports", icon: BarChart2 },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();

  return (
    <motion.aside
      initial={{ width: isOpen ? 256 : 80 }}
      animate={{ width: isOpen ? 256 : 80 }}
      transition={{ duration: 0.25 }}
      className={`bg-white dark:bg-gray-900 shadow-lg min-h-screen border-r border-gray-200 dark:border-gray-700 flex flex-col`}
    >
      {/* Logo / Project Name */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700"
        onClick={toggle}
      >
        <div className="bg-teal-500 text-white p-2 rounded-lg font-bold text-lg">
          BS
        </div>
        {isOpen && (
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
            BitStay CRM
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  data-tooltip-id={`tip-${item.name}`}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-teal-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-teal-800"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span>{item.name}</span>}
                </Link>
                {!isOpen && (
                  <Tooltip
                    id={`tip-${item.name}`}
                    content={item.name}
                    place="right"
                    className="!bg-gray-800 !text-white !px-2 !py-1 !rounded"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.aside>
  );
}
