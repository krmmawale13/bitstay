import React from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Topbar />
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 flex">
        <Sidebar />
        <main className="flex-1 py-6 md:pl-6">
          {children}
        </main>
      </div>
    </div>
  );
}