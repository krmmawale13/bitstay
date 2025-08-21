import { motion } from "framer-motion";
import { Search, Bell, Settings, User } from "lucide-react";

export default function Topbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between 
                 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500
                 border-b border-transparent shadow-lg px-6 py-3"
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="BitStay"
          className="w-8 h-8 rounded-full border border-white/30 shadow"
        />
        <span className="text-white font-semibold text-lg">BitStay</span>
      </div>

      {/* Center: Search */}
      <div className="flex items-center flex-1 justify-center">
        <div className="flex items-center bg-white rounded-full px-4 py-1 shadow-md
                        transition-all duration-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-white/50">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search anything..."
            className="ml-2 bg-transparent outline-none text-gray-700 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-4">
        <Bell className="w-5 h-5 text-white/80 hover:text-white transition" />
        <Settings className="w-5 h-5 text-white/80 hover:text-white transition" />

        {/* User Dropdown */}
        <div className="relative group">
          <div className="flex items-center gap-2 cursor-pointer">
            <User className="w-6 h-6 text-white/80 group-hover:text-white transition" />
            <span className="text-white font-medium">Username</span>
          </div>
          <div className="absolute right-0 mt-2 w-48 
                          bg-white/80 backdrop-blur-lg rounded-lg shadow-lg opacity-0 invisible 
                          group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <ul className="p-2">
              <li className="px-3 py-2 hover:bg-white/50 rounded-md cursor-pointer">Profile</li>
              <li className="px-3 py-2 hover:bg-white/50 rounded-md cursor-pointer">Account Settings</li>
              <li className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md cursor-pointer">Logout</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
