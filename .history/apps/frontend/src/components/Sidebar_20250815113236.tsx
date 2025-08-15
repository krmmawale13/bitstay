import React from 'react';

const links = [
  { href: '/dashboardPage', label: 'Dashboard' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/customers', label: 'Customers' },
];

function Sidebar() {
  return (
    <aside className="w-60 border-r border-slate-200 dark:border-slate-800 p-4">
      <nav className="space-y-2">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="block text-sm text-slate-600 hover:text-slate-900">
            {l.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;