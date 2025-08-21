import { Bell, Search, User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
                 border-b border-gray-200 dark:border-gray-700 shadow px-6 py-3 relative"
    >
      {/* Top Row: Branding */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            onClick={toggleSidebar}
            className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-teal-500 transition-colors"
          >
            ☰
          </div>
          <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
            BitStay
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          CRM Dashboard
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between relative">
        {/* Center Search */}
        <div className="absolute left-1/2 -translate-x-1/2 w-1/3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 shadow-sm 
                          focus-within:ring-2 focus-within:ring-teal-400">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search anything..."
              className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white 
                         placeholder-gray-500 dark:placeholder-gray-400 w-full"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Theme Toggle */}
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

          {/* Notification */}
          <motion.div
            whileHover={{ scale: 1.15 }}
            className="relative cursor-pointer"
          >
            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-teal-500 transition-colors" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
              3
            </span>
          </motion.div>

          {/* Account */}
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                Username
              </span>
            </motion.div>

            {accountOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                           border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
              >
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                  Signed in as
                  <br />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    johndoe@example.com
                  </span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <button className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
                  <User className="w-5 h-5" /> Profile
                </button>
                <button className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Settings className="w-5 h-5" /> Settings
                </button>
                <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
