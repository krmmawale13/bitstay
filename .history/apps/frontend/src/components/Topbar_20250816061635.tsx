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
      className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow px-6 py-3"
    >
      {/* Left Section: Sidebar toggle + Branding */}
      <div className="flex items-center gap-4">
        <div
          onClick={toggleSidebar}
          className="cursor-pointer text-white font-bold hover:text-gray-200 transition-colors"
        >
          ☰
        </div>
        <span className="text-lg font-semibold tracking-wide">
          CRM Dashboard
        </span>
      </div>

      {/* Search Center */}
      <div className="flex items-center bg-white/20 rounded-lg px-3 py-1 backdrop-blur-sm focus-within:ring-2 focus-within:ring-yellow-300 w-1/3">
        <Search className="w-5 h-5 text-white" />
        <input
          type="text"
          placeholder="Search..."
          className="ml-2 bg-transparent outline-none text-white placeholder-white/80 w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5">
        <motion.div whileHover={{ scale: 1.15 }}>
          <Bell className="w-6 h-6 cursor-pointer hover:text-yellow-300 transition-colors" />
        </motion.div>
        <motion.div whileHover={{ scale: 1.15 }} className="relative group">
          <User className="w-6 h-6 cursor-pointer hover:text-yellow-300 transition-colors" />
          {/* Future dropdown */}
          <div className="absolute right-0 mt-2 hidden group-hover:block bg-white text-gray-800 rounded-lg shadow-lg w-48">
            <ul>
              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</li>
              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Logout</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
