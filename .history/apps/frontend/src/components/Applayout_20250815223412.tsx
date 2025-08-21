import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Applayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen((s) => !s)}
      />

      <div className="flex flex-col flex-1">
        <Topbar toggleSidebar={() => setIsSidebarOpen((s) => !s)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
