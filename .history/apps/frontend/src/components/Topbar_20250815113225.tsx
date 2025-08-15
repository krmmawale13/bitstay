import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
      <div className="font-semibold">BitStay</div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500">{user?.email}</span>
        <button onClick={logout} className="px-2 py-1 rounded-md border">Logout</button>
      </div>
    </div>
  );
}