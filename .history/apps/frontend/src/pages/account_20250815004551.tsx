import React, { useEffect } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { useRouter } from 'next/router';

export default function AccountPage() {
  const router = useRouter();
  useEffect(() => { if (!requireAuth()) router.replace('/login'); }, [router]);
  const user = getCurrentUser();

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Account Settings</h1>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-500">First Name (tbl_users.first_name)</label>
              <input defaultValue={user?.first_name} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"/>
            </div>
            <div>
              <label className="text-sm text-slate-500">Last Name (tbl_users.last_name)</label>
              <input defaultValue={user?.last_name} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"/>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-500">Email (tbl_users.email)</label>
              <input defaultValue={user?.email} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"/>
            </div>
          </div>
          <div className="mt-4">
            <button className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2">Save Changes</button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-500">New Password</label>
              <input type="password" className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"/>
            </div>
            <div>
              <label className="text-sm text-slate-500">Confirm Password</label>
              <input type="password" className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"/>
            </div>
          </div>
          <div className="mt-4">
            <button className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2">Update Password</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}