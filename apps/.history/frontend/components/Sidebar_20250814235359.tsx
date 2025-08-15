import { HomeIcon, UserGroupIcon, ClipboardDocumentIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const menu = [
  { name: "Dashboard", icon: HomeIcon, path: "/dashboardPage" },
  { name: "Customers", icon: UserGroupIcon, path: "/customerPage" },
  { name: "Bookings", icon: ClipboardDocumentIcon, path: "/bookingPage" },
  { name: "Settings", icon: Cog6ToothIcon, path: "/settingsPage" },
];

export default function Sidebar() {
  return (
    <aside className="bg-primary text-white w-64 min-h-screen p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-8">BitStay</h2>
      <nav className="space-y-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/80 transition"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
