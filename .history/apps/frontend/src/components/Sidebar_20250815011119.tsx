// apps/frontend/src/components/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { User } from '@/types/user';
import axios from 'axios';

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    axios.get<User>('/api/v1/users/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  return (
    <aside className="w-64 bg-gray-100 h-full p-4">
      {user && (
        <div className="mb-6">
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>
      )}
      <nav>
        {/* links here */}
      </nav>
    </aside>
  );
}
