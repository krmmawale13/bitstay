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
