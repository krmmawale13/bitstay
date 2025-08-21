import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow px-6 py-3"
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
          placeholder="Search anything..."
          className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5 relative">
        {/* Notifications */}
        <motion.div whileHover={{ scale: 1.15 }}>
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-teal-500 transition-colors" />
        </motion.div>

        {/* User Account */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img
            src="https://ui-avatars.com/api/?name=John+Doe&background=0D9488&color=fff"
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="hidden sm:block text-gray-700 dark:text-gray-300 font-medium">
            John Doe
          </span>
        </motion.div>

        {/* Dropdown */}
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              Signed in as <br />
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                johndoe@example.com
              </span>
            </div>
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <User className="w-4 h-4 mr-2" /> Profile
            </div>
            <div className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </div>
            <div className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
