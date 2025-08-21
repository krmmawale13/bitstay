import { Bell, Search, User, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow px-6 py-3"
    >
      {/* Left - Sidebar toggle + Logo */}
      <div className="flex items-center gap-4">
        <div
          onClick={toggleSidebar}
          className="cursor-pointer text-gray-600 dark:text-gray-300 font-bold hover:text-teal-500 transition-colors text-xl"
        >
          ☰
        </div>
        <div className="flex items-center gap-2">
          <span className="text-teal-500 font-bold text-lg">BitStay</span>
          <span className="text-gray-500 text-sm hidden sm:block">Dashboard</span>
        </div>
      </div>

      {/* Middle - Search */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1 w-60 focus-within:ring-2 focus-within:ring-teal-400">
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search..."
          className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full"
        />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-5">
        {/* Dark mode toggle */}
        <motion.div
          whileHover={{ scale: 1.15 }}
          onClick={() => setDarkMode(!darkMode)}
          className="cursor-pointer"
        >
          {darkMode ? (
            <Sun className="w-6 h-6 text-yellow-400" />
          ) : (
            <Moon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </motion.div>

        {/* Notifications with badge */}
        <motion.div whileHover={{ scale: 1.15 }} className="relative cursor-pointer">
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-teal-500 transition-colors" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
            3
          </span>
        </motion.div>

        {/* User profile */}
        <motion.div whileHover={{ scale: 1.15 }} className="flex items-center gap-2 cursor-pointer">
          <img
            src="https://i.pravatar.cc/32"
            alt="User"
            className="w-8 h-8 rounded-full border border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
            John Doe
          </span>
        </motion.div>
      </div>
    </motion.header>
  );
}
