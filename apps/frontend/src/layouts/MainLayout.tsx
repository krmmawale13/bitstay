// apps/frontend/src/layouts/MainLayout.tsx
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useEffect, useState } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Optional: respect saved theme for SSR hydration flicker
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved) document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* Global gradient background to match topbar/sidebar */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.25),transparent_60%)] mix-blend-soft-light" />

      {/* Layout rows */}
      <div className="flex">
        {/* Sidebar (overlay on mobile) */}
        <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Main column */}
        <div className="flex-1 min-w-0 md:ml-0 ml-[80px] ">
          <Topbar toggleSidebar={() => setIsSidebarOpen((v) => !v)} />
          <main className="p-4 md:p-6">
            {/* Content card wrapper to keep readability on gradient */}
            <div className="rounded-2xl border border-white/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg">
              <div className="p-4 md:p-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
