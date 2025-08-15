import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ApiUser, ApiResponse } from '@/types/api';

const Sidebar: React.FC = () => {
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    axios
      .get<ApiResponse<ApiUser>>('/api/v1/users/me', { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching user:', err);
      });
  }, []);

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        {user && (
          <>
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt="avatar"
                className="w-12 h-12 rounded-full mb-2 object-cover"
              />
            )}
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <a href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-700">
          Dashboard
        </a>
        <a href="/bookings" className="block px-3 py-2 rounded hover:bg-gray-700">
          Bookings
        </a>
        <a href="/customers" className="block px-3 py-2 rounded hover:bg-gray-700">
          Customers
        </a>
        <a href="/settings" className="block px-3 py-2 rounded hover:bg-gray-700">
          Settings
        </a>
      </nav>
    </div>
  );
};

export default Sidebar;
// apps/frontend/src/components/Sidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bookings", label: "Bookings" },
  { href: "/guests", label: "Guests" },
  { href: "/rooms", label: "Rooms" },
  { href: "/billing", label: "Billing" },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useRouter();

  return (
    <aside className="h-screen w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="h-16 flex items-center px-4 text-xl font-semibold">
        BitStay
      </div>
      <div className="px-3">
        <div className="px-2 py-3 text-xs text-slate-400 uppercase tracking-wide">
          {user?.name ? `Hi, ${user.name}` : "Welcome"}
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2 text-sm ${
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
