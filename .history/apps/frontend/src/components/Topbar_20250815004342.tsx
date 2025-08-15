import React from 'react';
import { Moon, Sun, Bell, LogOut, UserCircle2 } from 'lucide-react';
import { clearSession, getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/router';

export default function Topbar() {
  const router = useRouter();
  const user = getCurrentUser();
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [dark]);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <div className="h-8 w-8 rounded-xl bg-brand-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">BitStay</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <button onClick={() => setDark(v=>!v)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">
            {dark ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
            <Bell className="h-5 w-5"/>
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <UserCircle2 className="h-6 w-6"/>
              <span className="hidden sm:block text-sm text-slate-700 dark:text-slate-200">{user?.first_name ?? 'User'}</span>
            </button>
            <div className="absolute right-0 mt-2 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg min-w-[200px]">
              <button onClick={() => router.push('/account')} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">Account Settings</button>
              <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <LogOut className="h-4 w-4"/> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}