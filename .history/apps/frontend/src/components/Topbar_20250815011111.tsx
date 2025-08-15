// apps/frontend/src/components/Topbar.tsx
import React, { useEffect, useState } from 'react';
import { User } from '@/types/user';
import axios from 'axios';

export default function Topbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    axios.get<User>('/api/v1/users/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      {user && (
        <div className="flex items-center space-x-2">
          <img
            src={user.avatarUrl || '/default-avatar.png'}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
          <span>{user.name}</span>
        </div>
      )}
    </div>
  );
}
