import { Bell, Search, User } from "lucide-react";
import { motion } from "framer-motion";

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 shadow px-6 py-3"
    >
      {/* Left - Branding + Sidebar toggle */}
      <div className="flex items-center gap-4">
        <div
          onClick={toggleSidebar}
          className="cursor-pointer text-gray-600 dark:text-gray-300 font-bold hover:text-teal-500 transition-colors"
        >
          ☰
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="Brand Logo"
            className="w-8 h-8 rounded"
          />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            BitStay
          </span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-1 w-1/3 shadow-sm focus-within:ring-2 focus-within:ring-teal-400">
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search..."
          className="ml-2 w-full bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-5">
        <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer relative">
          <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          {/* User dropdown placeholder */}
          {/* Future: Profile settings, logout, etc. */}
        </motion.div>
      </div>
    </motion.header>
  );
}
