import { Bell, Search, User } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow px-4 py-3"
    >
      {/* Left: Branding + Toggle */}
      <div className="flex items-center gap-3">
        <div
          onClick={toggleSidebar}
          className="cursor-pointer text-gray-600 dark:text-gray-300 font-bold hover:text-teal-500 transition-colors"
        >
          ☰
        </div>
        <Image
          src="/logo.png"
          alt="BitStay Logo"
          width={28}
          height={28}
          className="rounded"
        />
        <span className="text-lg font-bold text-gray-800 dark:text-white">
          BitStay
        </span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="flex items-center w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1 focus-within:ring-2 focus-within:ring-teal-400">
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-full bg-transparent outline-none text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-5">
        <motion.div whileHover={{ scale: 1.15 }}>
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-teal-500 transition-colors" />
        </motion.div>

        {/* Account dropdown placeholder */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          <span className="hidden sm:block text-gray-700 dark:text-white text-sm">
            Username
          </span>
        </motion.div>
      </div>
    </motion.header>
  );
}
