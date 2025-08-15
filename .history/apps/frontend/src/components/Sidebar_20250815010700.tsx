// apps/frontend/src/components/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  role: string; // adapt to your RoleEnum from schema
}

const Sidebar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get<User>('/api/v1/users/me', { withCredentials: true });
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4 font-bold text-xl">BitStay</div>
      <div className="p-4 border-b border-gray-700">
        {user ? (
          <>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-400">{user.role}</p>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <nav className="p-4 space-y-2">
        <Link href="/dashboardPage" className="block hover:bg-gray-700 p-2 rounded">Dashboard</Link>
        <Link href="/customerPage" className="block hover:bg-gray-700 p-2 rounded">Customers</Link>
        <Link href="/bookingPage" className="block hover:bg-gray-700 p-2 rounded">Bookings</Link>
        <Link href="/roomPage" className="block hover:bg-gray-700 p-2 rounded">Rooms</Link>
        <Link href="/barPage" className="block hover:bg-gray-700 p-2 rounded">Bar</Link>
        <Link href="/inventoryPage" className="block hover:bg-gray-700 p-2 rounded">Inventory</Link>
        <Link href="/reportsPage" className="block hover:bg-gray-700 p-2 rounded">Reports</Link>
        <Link href="/settingsPage" className="block hover:bg-gray-700 p-2 rounded">Settings</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
