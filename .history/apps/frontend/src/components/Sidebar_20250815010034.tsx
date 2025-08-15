// src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";

interface User {
  id: number;
  name: string;
  role: string;
}

interface SidebarLink {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Define role-based menu items
  const menuByRole: Record<string, SidebarLink[]> = {
    ADMIN: [
      { name: "Dashboard", path: "/dashboardPage" },
      { name: "Customers", path: "/customerPage" },
      { name: "Bookings", path: "/bookingPage" },
      { name: "Rooms", path: "/roomPage" },
      { name: "Inventory", path: "/inventoryPage" },
      { name: "Reports", path: "/reportsPage" },
      { name: "Settings", path: "/settingsPage" },
    ],
    MANAGER: [
      { name: "Dashboard", path: "/dashboardPage" },
      { name: "Customers", path: "/customerPage" },
      { name: "Bookings", path: "/bookingPage" },
      { name: "Rooms", path: "/roomPage" },
    ],
    RECEPTIONIST: [
      { name: "Dashboard", path: "/dashboardPage" },
      { name: "Bookings", path: "/bookingPage" },
      { name: "Customers", path: "/customerPage" },
    ],
    DEFAULT: [{ name: "Dashboard", path: "/dashboardPage" }],
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/v1/auth/me", { withCredentials: true });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
        router.push("/loginPage");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="p-4 text-gray-500">
        Loading menu...
      </div>
    );
  }

  const roleMenu = user ? menuByRole[user.role] || menuByRole.DEFAULT : menuByRole.DEFAULT;

  return (
    <aside className="bg-gray-800 text-white h-full w-64 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Welcome, {user?.name || "Guest"}</h2>
        <p className="text-sm text-gray-300">{user?.role || "N/A"}</p>
      </div>

      <nav className="space-y-2">
        {roleMenu.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`block px-3 py-2 rounded hover:bg-gray-700 ${
              router.pathname === link.path ? "bg-gray-700" : ""
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
