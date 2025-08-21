// src/pages/dashboardPage.tsx
import { motion } from "framer-motion";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-secondary text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h1 className="text-2xl font-semibold text-primary">Welcome to BitStay</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Your one-stop hospitality management dashboard. Everything you need in one place.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Bookings Today", value: 14, color: "bg-teal-500" },
              { title: "Occupancy Rate", value: "82%", color: "bg-gold-400" },
              { title: "Revenue", value: "₹45,200", color: "bg-pink-500" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`rounded-2xl shadow-md p-6 text-white ${stat.color}`}
              >
                <h2 className="text-lg">{stat.title}</h2>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "New Booking",
                "Check-in",
                "Check-out",
                "Inventory",
                "POS / Bar",
                "Reports",
                "Settings",
                "Customers",
              ].map((action, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-primary text-white py-3 px-4 rounded-xl shadow-md hover:bg-primary/80 transition"
                >
                  {action}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
