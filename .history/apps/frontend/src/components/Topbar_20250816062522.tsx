import React from "react";
import { Home, Users, Settings, BarChart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside
      className={cn(
        "h-screen text-white flex flex-col transition-all duration-300",
        // Topbar जैसा gradient
        "bg-gradient-to-b from-teal-500 via-cyan-500 to-blue-500",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Logo / Branding */}
      <div className="flex items-center justify-center h-16 border-b border-white/20">
        <span className="text-lg font-bold">LOGO</span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-2">
        <Link
          href="#"
          className="flex items-center space-x-3 p-2 rounded hover:bg-white/20 transition"
        >
          <Home size={20} />
          {isOpen && <span>Dashboard</span>}
        </Link>

        <Link
          href="#"
          className="flex items-center space-x-3 p-2 rounded hover:bg-white/20 transition"
        >
          <Users size={20} />
          {isOpen && <span>Customers</span>}
        </Link>

        <Link
          href="#"
          className="flex items-center space-x-3 p-2 rounded hover:bg-white/20 transition"
        >
          <BarChart size={20} />
          {isOpen && <span>Reports</span>}
        </Link>

        <Link
          href="#"
          className="flex items-center space-x-3 p-2 rounded hover:bg-white/20 transition"
        >
          <Settings size={20} />
          {isOpen && <span>Settings</span>}
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        {isOpen && <span className="text-sm opacity-75">© 2025 BitStay</span>}
      </div>
    </aside>
  );
};

export default Sidebar;
