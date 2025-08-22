// apps/frontend/src/components/Topbar.tsx
import { Bell, Search, User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { logout as doLogout } from "@/services/auth.service"; // if exists
import { getCurrentUser } from "@/lib/auth"; // ✅ use the canonical helper

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const router = useRouter();

  // --- THEME (persist + html class) ---
  const [darkMode, setDarkMode] = useState<boolean>(false);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefers =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const _isDark = saved ? saved === "dark" : prefers;
    setDarkMode(_isDark);
    document.documentElement.classList.toggle("dark", _isDark);
  }, []);
  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  // --- USER (canonical: currentUser) ---
  const user = useMemo(() => {
    // use helper so name/first_name/last_name normalize ho jaye
    return getCurrentUser();
  }, []);
  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "user@example.com";

  const [accountOpen, setAccountOpen] = useState(false);

  const onLogout = () => {
    try {
      if (typeof doLogout === "function") {
        doLogout(); // this removes token, activeTenantId, currentUser
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("activeTenantId");
        localStorage.removeItem("currentUser"); // ✅ correct key
      }
    } finally {
      router.push("/login");
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative px-4 md:px-6 py-3 shadow border-b border-transparent
           bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500
           dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
           before:content-[''] before:absolute before:inset-0 before:pointer-events-none
           before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_28%,rgba(255,255,255,0)_60%)]
           before:opacity-60 before:mix-blend-soft-light"
    >
      {/* Row 1: toggle + brand + title */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={toggleSidebar}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl
                     bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-xl font-bold text-white">BitStay</span>
          <span className="ml-2 text-sm font-medium text-white/90">CRM Dashboard</span>
        </div>
      </div>

      {/* Row 2: search center + actions right */}
      <div className="flex items-center justify-between relative">
        {/* Center Search */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[60%] max-w-xl hidden sm:block">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-3 py-1.5 shadow-md 
                          focus-within:ring-2 focus-within:ring-white/50 dark:focus-within:ring-teal-400
                          transition-all duration-200 hover:shadow-lg">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search anything…"
              className="ml-2 bg-transparent outline-none text-gray-700 dark:text-white 
                         placeholder-gray-500 dark:placeholder-gray-400 w-full"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl
                       bg-white/10 hover:bg-white/20 border border-white/20 transition"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="text-yellow-300" size={18} /> : <Moon className="text-white/90" size={18} />}
          </motion.button>

          {/* Notification */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl
                       bg-white/10 hover:bg-white/20 border border-white/20 transition"
            aria-label="Notifications"
          >
            <Bell className="text-white/90" size={18} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
              3
            </span>
          </motion.button>

          {/* Account */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5
                         bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
            >
              <User size={18} />
              <span className="hidden sm:inline font-medium">{displayName}</span>
            </motion.button>

            {accountOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-56 
                           bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl
                           border border-white/20 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50"
              >
                <div className="px-4 py-3 text-xs text-gray-700 dark:text-gray-400">
                  Signed in as
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {displayEmail}
                  </div>
                </div>
                <hr className="border-white/20 dark:border-gray-700" />
                <button className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-white/60 dark:hover:bg-gray-800/60">
                  <User className="w-5 h-5" /> Profile
                </button>
                <button className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-white/60 dark:hover:bg-gray-800/60">
                  <Settings className="w-5 h-5" /> Settings
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
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
