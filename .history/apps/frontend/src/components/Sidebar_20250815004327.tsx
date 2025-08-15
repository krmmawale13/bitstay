import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ROLE_MODULES } from '@/utils/role';
import { getCurrentUser } from '@/lib/auth';
import { LayoutDashboard, Users, CalendarCheck, BedDouble, GlassWater, Boxes, ShieldCheck, FileBarChart, Settings as Cog } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  customers: <Users className="h-5 w-5" />,
  bookings: <CalendarCheck className="h-5 w-5" />,
  rooms: <BedDouble className="h-5 w-5" />,
  bar: <GlassWater className="h-5 w-5" />,
  inventory: <Boxes className="h-5 w-5" />,
  compliance: <ShieldCheck className="h-5 w-5" />,
  reports: <FileBarChart className="h-5 w-5" />,
  settings: <Cog className="h-5 w-5" />
};

export default function Sidebar() {
  const user = getCurrentUser();
  const role = user?.role ?? 'RECEPTIONIST';
  const allowed = ROLE_MODULES[role];
  const router = useRouter();

  return (
    <aside className="hidden md:flex md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col p-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-xl bg-brand-600" />
        <span className="font-semibold text-slate-800 dark:text-slate-100">BitStay</span>
      </div>
      <nav className="space-y-1">
        {allowed.map((key) => (
          <Link key={key} href={`/${key === 'dashboard' ? 'dashboard' : key}`}>
            <a className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 ${
              router.pathname.includes(key === 'dashboard' ? '/dashboard' : `/${key}`)
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}>
              {ICONS[key]}
              <span className="capitalize">{key}</span>
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}