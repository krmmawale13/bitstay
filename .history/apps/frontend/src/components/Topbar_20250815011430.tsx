import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ApiUser, ApiResponse } from '@/types/api';

const Topbar: React.FC = () => {
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
    <div className="w-full flex justify-between items-center bg-white shadow px-4 py-2">
      <h1 className="text-lg font-semibold text-gray-700">Dashboard</h1>
      {user && (
        <div className="flex items-center space-x-3">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Topbar;
