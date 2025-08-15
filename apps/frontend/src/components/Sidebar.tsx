import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/utils/cn"; // Utility for class merging

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

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 shadow-lg min-h-screen">
      <div className="p-4 text-xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
        BitStay CRM
      </div>
      <nav className="mt-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={cn(
                  "block px-4 py-2 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors",
                  router.pathname === item.path
                    ? "bg-teal-500 text-white"
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
