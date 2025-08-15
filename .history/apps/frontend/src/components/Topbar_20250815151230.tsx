import { Bell, Search, User } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-800 shadow px-6 py-4">
      {/* Search */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search..."
          className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white"
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-4">
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer" />
        <User className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer" />
      </div>
    </header>
  );
}
