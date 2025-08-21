// src/components/Topbar.tsx
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
      className="flex items-center justify-between bg-white dark:bg-gray-800 shadow-lg px-6 py-4 rounded-b-2xl"
    >
      <div
        onClick={toggleSidebar}
        className="cursor-pointer text-gray-600 dark:text-gray-300 mr-4 font-bold"
      >
        ☰
      </div>
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-teal-400">
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search..."
          className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>
      <div className="flex items-center gap-5">
        <motion.div whileHover={{ scale: 1.15 }}>
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-teal-500 transition-colors" />
        </motion.div>
        <motion.div whileHover={{ scale: 1.15 }}>
          <User className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-teal-500 transition-colors" />
        </motion.div>
      </div>
    </motion.header>
  );
}
