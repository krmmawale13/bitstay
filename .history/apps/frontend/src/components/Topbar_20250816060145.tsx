import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow px-6 py-3 relative"
    >
      {/* Sidebar toggle */}
      <div
        onClick={toggleSidebar}
        className="cursor-pointer text-gray-600 dark:text-gray-300 mr-4 font-bold hover:text-teal-500 transition-colors"
      >
        ☰
      </div>

      {/* Search */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1 focus-within:ring-2 focus-within:ring-teal-400">
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search..."
          className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <motion.div whileHover={{ scale: 1.15 }}>
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-teal-500 transition-colors" />
        </motion.div>

        {/* Account Section */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.15 }}
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <User className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-teal-500 transition-colors" />
            <span className="text-gray-700 dark:text-white font-medium">
              Username
            </span>
          </motion.div>

          {/* Dropdown Menu */}
          {isAccountOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
            >
              <button className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
                <User className="w-5 h-5" /> Profile
              </button>
              <button className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="w-5 h-5" /> Account Settings
              </button>
              <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
