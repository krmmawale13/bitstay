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
import "react-tooltip/dist/react-tooltip.css";

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
      className="min-h-screen flex flex-col shadow-lg border-r border-gray-200 dark:border-gray-700 
                 bg-gradient-to-b from-teal-600 to-emerald-700 text-white"
    >
      {/* Logo / Placeholder for Dashboard Name */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer border-b border-white/20"
        onClick={toggle}
      >
        <div className="bg-white text-teal-700 p-2 rounded-lg font-bold text-lg shadow-md">
          BS
        </div>
        {isOpen && (
          <span className="text-lg font-semibold tracking-wide">
            {/* Placeholder: Future Dynamic Dashboard Name */}
            CRM Dashboard
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
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-white/20 backdrop-blur-sm shadow-sm scale-[1.02]"
                      : "hover:bg-white/10"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span>{item.name}</span>}
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
    </motion.aside>
  );
}
