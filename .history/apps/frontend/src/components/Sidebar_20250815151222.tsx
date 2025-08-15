import { Home, Users, BarChart, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div className="p-6 text-xl font-bold text-gray-800 dark:text-white">
        BitStay CRM
      </div>
      <nav className="space-y-2 px-4">
        <a className="flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" href="/dashboard">
          <Home className="w-5 h-5 mr-3" /> Dashboard
        </a>
        <a className="flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" href="/customers">
          <Users className="w-5 h-5 mr-3" /> Customers
        </a>
        <a className="flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" href="/reports">
          <BarChart className="w-5 h-5 mr-3" /> Reports
        </a>
        <a className="flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" href="/settings">
          <Settings className="w-5 h-5 mr-3" /> Settings
        </a>
      </nav>
    </aside>
  );
}
