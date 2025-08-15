// apps/frontend/src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "@/types/user"; // Adapted according to your Prisma schema
import axios from "axios";

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    axios.get("/api/v1/auth/me")
      .then((res) => {
        setUser(res.data as User);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });
  }, []);

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        {user ? (
          <div>
            <p className="font-bold">{user.fullName}</p>
            <p className="text-sm text-gray-400">{user.role}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <nav className="flex-1 p-4">
        <ul>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/customers">Customers</Link>
          </li>
          <li>
            <Link href="/bookings">Bookings</Link>
          </li>
          {/* Add more links according to your modules */}
        </ul>
      </nav>
    </aside>
  );
}
