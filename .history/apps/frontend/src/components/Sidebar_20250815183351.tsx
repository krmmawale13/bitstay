// src/components/Sidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Customers", path: "/customers" },
  { name: "Bookings", path: "/bookings" },
  { name: "Rooms", path: "/rooms" },
  { name: "Bar / POS", path: "/bar" },
  { name: "Inventory", path: "/inventory" },
  { name: "Reports", path: "/reports" },
  { name: "Settings", path: "/settings" },
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className={`bg-white dark:bg-gray-900 shadow-lg min-h-screen transition-all ${isOpen ? "w-64" : "w-20"}`}>
      <div
        className="p-4 text-xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={toggle}
      >
        BitStay CRM
      </div>
      <nav className="mt-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={clsx(
                    "block px-4 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-teal-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-teal-800"
                  )}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
