import React from 'react';
import { useRouter } from 'next/router';
import { setSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('admin@bitstay.app');
  const [role, setRole] = React.useState<'ADMIN'|'MANAGER'|'RECEPTIONIST'|'CASHIER'|'HOUSEKEEPING'>('ADMIN');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSession({ id: '1', first_name: 'Admin', last_name: 'User', email, role }, 'demo-token');
    router.replace('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl shadow border border-slate-200 dark:border-slate-800 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Sign in to BitStay</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:outline-none"/>
        <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2">
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="CASHIER">Cashier</option>
          <option value="HOUSEKEEPING">Housekeeping</option>
        </select>
        <button type="submit" className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white py-2 font-medium">Login</button>
      </form>
    </div>
  );
}
